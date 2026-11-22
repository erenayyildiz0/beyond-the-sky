import * as THREE from "three";
import vert from "./shaders/planet.vert.glsl?raw";
import frag from "./shaders/starSurface.frag.glsl?raw";
import coronaVert from "./shaders/corona.vert.glsl?raw";
import coronaFrag from "./shaders/corona.frag.glsl?raw";
import { mulberry32 } from "./rng";

/** Güneş'in görüntü tonu (filtreli güneş fotoğraflarındaki sarı; gerçek renk beyaza yakın) */
export const SUN_TINT = [1.0, 0.8, 0.45] as const;

/** Bütün yıldız yüzeylerinin ortak saati (sn); ana döngü günceller. */
export const STAR_TIME = { value: 0 };

/**
 * Yüzey görünümü (temsili; renk ve boyut gerçek). Granül boyutu basınç ölçek yüksekliğiyle (∝ T/g) büyür; kütle bilinmediği
 * için yarıçapla yaklaşık: Güneş'te yarıçap başına ~700 granül (~1.000 km), süperdevlerde birkaç dev hücre
 * (Betelgeuse'ün yüzeyinde görülen gibi). Sıcak yıldızlarda (> ~7.500 K) dış konveksiyon ve korona zayıftır.
 */
export function starLook(T: number, rSun: number) {
  const cool = 1 - THREE.MathUtils.smoothstep(T, 6800, 9000);
  // Devlerde sıcak beyaz korona yerine soğuk, genişlemiş gaz zarfı (kızıl, sönük); çıkıntılar Güneş benzeri yıldızlarda
  const giant = THREE.MathUtils.smoothstep(rSun, 5, 30);
  // Kromosfer ve çıkıntılar dış konveksiyon bölgesinden beslenir; A/B yıldızlarında (Sirius, Vega, Rigel) yok denecek kadar zayıf
  return {
    cool,
    cells: THREE.MathUtils.clamp(700 * rSun ** -0.75, 3, 3000),
    contrast: 0.35 + 0.65 * cool,
    corona: (0.35 + 0.65 * cool) * (1 - 0.75 * giant),
    prom: cool * (1 - giant),
    spots: T > 3000 && T < 6500,
  };
}

export function createStarSurfaceMaterial(gain = 1.15) {
  const spots = Array.from({ length: 6 }, () => new THREE.Vector4());
  return new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag,
    uniforms: {
      uColor: { value: new THREE.Color(1, 1, 1) }, uTint: { value: new THREE.Vector3(1, 1, 1) }, uOpacity: { value: 1 }, uTime: STAR_TIME, uGain: { value: gain }, uCool: { value: 1 },
      uCells: { value: 700 }, uContrast: { value: 1 }, uSpots: { value: spots },
    },
  });
}

/**
 * Görüntü tonu (sıcaklığa göre): filtreli yıldız/güneş fotoğraflarındaki gibi. Güneş benzeri yıldızlar altın sarısı, sıcaklar
 * hafif mavi. Soğuk yıldızlar (K/M) zaten turuncu-kızıl: ton eklenmez, yoksa bakır renkli "lav"a döner. Gerçekte 5.000–7.000 K
 * yıldızlar gözle beyaza yakındır (renk için kelvinToRgb gerçek).
 */
export function starTint(T: number): [number, number, number] {
  const S = THREE.MathUtils.smoothstep;
  const warm = S(T, 3800, 5000) * (1 - S(T, 6000, 8000)), hot = S(T, 8000, 11000);
  const mid: [number, number, number] = [1.0, 0.95, 0.88];
  return [0, 1, 2].map(k => mid[k] + (SUN_TINT[k] - mid[k]) * warm + ([0.88, 0.94, 1.0][k] - mid[k]) * hot) as [number, number, number];
}

/** Yüzey ve çevre malzemelerini yıldıza göre ayarla; seed lekelerin ve çıkıntıların yerini belirler. */

export function applyStarLook(surface: THREE.ShaderMaterial, corona: THREE.ShaderMaterial | null, color: THREE.Color, T: number, rSun: number, seed: number) {
  const look = starLook(T, rSun);
  const rnd = mulberry32(seed);
  surface.uniforms.uColor.value.copy(color);
  surface.uniforms.uTint.value.set(...starTint(T));
  surface.uniforms.uCells.value = look.cells;
  surface.uniforms.uContrast.value = look.contrast;
  surface.uniforms.uCool.value = look.cool;
  // Lekeler etkin enlemlerde (±8–30°); boyut 10.000–40.000 km (Güneş ölçeğinde)
  const n = look.spots ? 3 + Math.floor(rnd() * 4) : 0;
  (surface.uniforms.uSpots.value as THREE.Vector4[]).forEach((s, i) => {
    if (i >= n) { s.set(0, 0, 0, 0); return; }
    const lat = (8 + 22 * rnd()) * (rnd() < 0.5 ? -1 : 1) * Math.PI / 180, lon = rnd() * Math.PI * 2;
    s.set(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon), 0.012 + 0.03 * rnd());
  });
  if (corona) {
    const u = corona.uniforms;
    u.uColor.value.copy(color);
    u.uCorona.value = look.corona;
    u.uProm.value = look.prom;
    (u.uProms.value as THREE.Vector4[]).forEach(p => {
      p.set(rnd() * Math.PI * 2, 0.04 + 0.1 * rnd(), 0.04 + 0.12 * rnd(), rnd() * 10);   // yükseklik 0,04–0,16 R (~30–110 bin km)
    });
  }
}

/**
 * Yıldızın çevresi (korona, kromosfer, çıkıntılar): tam ekran geçiş; yalnızca yıldızın 4,5 yarıçapı içindeki pikseller çalışır.
 * center/radius katman biriminde; pole dünya yönünde (bilinmiyorsa +y).
 */
export function createCorona(center: THREE.Vector3, radius: number, pole = new THREE.Vector3(0, 1, 0)) {
  const mat = new THREE.ShaderMaterial({
    vertexShader: coronaVert, fragmentShader: coronaFrag, transparent: true, depthTest: false, depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uInvProj: { value: new THREE.Matrix4() }, uCenter: { value: new THREE.Vector3() }, uPole: { value: new THREE.Vector3(0, 1, 0) },
      uRadius: { value: radius }, uOpacity: { value: 1 }, uTime: STAR_TIME, uCorona: { value: 1 }, uProm: { value: 1 },
      uColor: { value: new THREE.Color(1, 1, 1) }, uProms: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) },
    },
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 10;
  mesh.onBeforeRender = (_r, _s, camera) => {
    mat.uniforms.uInvProj.value.copy((camera as THREE.PerspectiveCamera).projectionMatrixInverse);
    mat.uniforms.uCenter.value.copy(center).applyMatrix4(camera.matrixWorldInverse);
    mat.uniforms.uPole.value.copy(pole).transformDirection(camera.matrixWorldInverse);
  };
  return {
    mesh, mat,
    set(c: THREE.Vector3, r: number) { center.copy(c); mat.uniforms.uRadius.value = r; },
  };
}
