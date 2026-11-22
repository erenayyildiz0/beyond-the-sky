"""Tarih çapaları görselleri (docs/EXTRAS.md T1): kamu malı ya da özgür lisanslı; küçültülüp yerel olarak yazılır.

Kimlik → (kaynak URL, emeği geçen, lisans). Web tarafındaki metinler ve kaynaklar web/src/content/history.ts'te.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

from bts.fetch import download

NASA_IMG = "https://images-assets.nasa.gov/image/{0}/{0}~{1}.jpg"
COMMONS = "https://commons.wikimedia.org/wiki/Special:FilePath/{0}?width=1280"

HISTORY_IMAGES: dict[str, tuple[str, str, str]] = {
    "jwst": (NASA_IMG.format("NHQ202112250011", "large"), "NASA/Bill Ingalls", "kamu malı"),
    "pluto": (NASA_IMG.format("PIA19952", "large"), "NASA/JHUAPL/SwRI", "kamu malı"),
    "hubble": (NASA_IMG.format("s31-04-027", "large"), "NASA", "kamu malı"),
    "pale_blue_dot": (NASA_IMG.format("PIA00452", "orig"), "NASA/JPL-Caltech", "kamu malı"),
    "voyager": (NASA_IMG.format("PIA21746", "medium"), "NASA/JPL", "kamu malı"),
    "apollo11": (NASA_IMG.format("as11-40-5903", "large"), "NASA", "kamu malı"),
    "earthrise": (NASA_IMG.format("as08-14-2383", "large"), "NASA", "kamu malı"),
    "neptune": (NASA_IMG.format("PIA01492", "large"), "NASA/JPL", "kamu malı"),
    "uranus": (NASA_IMG.format("PIA18182", "medium"), "NASA/JPL-Caltech", "kamu malı"),
    "chicxulub": (NASA_IMG.format("PIA03379", "large"), "NASA/JPL-Caltech", "kamu malı"),
    "sl9": (NASA_IMG.format("PIA00139", "orig"), "NASA/JPL", "kamu malı"),
    "sn1987a": (NASA_IMG.format("GSFC_20171208_Archive_e001986", "orig"), "NASA, ESA / Hubble", "kamu malı"),
    "kepler_snr": (NASA_IMG.format("PIA06908", "large"), "NASA/CXC", "kamu malı"),
    "disk": (NASA_IMG.format("PIA17849", "large"), "NASA/JPL-Caltech (sanatçı çizimi)", "kamu malı"),
    "milkyway": (NASA_IMG.format("PIA10748", "large"), "NASA/JPL-Caltech (sanatçı çizimi)", "kamu malı"),
    "xdf": (NASA_IMG.format("GSFC_20171208_Archive_e001651", "large"), "NASA, ESA / Hubble", "kamu malı"),
    # Planck CMB (ESA and the Planck Collaboration, CC BY-SA 3.0 IGO) — uçuştaki CMB küresiyle aynı kaynak
    "cmb": ("https://media.esa.int/legacy/web/images/esa_multimedia/images/2013/03/planck_cmb/12583930-4-eng-GB/Planck_CMB.jpg",
            "ESA and the Planck Collaboration", "CC BY-SA 3.0 IGO"),
    "bayeux": (COMMONS.format("Bayeux_Tapestry_scene32_Halley_comet.jpg"), "Bayeux duvar halısı, 11. yüzyıl", "kamu malı"),
    "principia": (COMMONS.format("Newton_-_Principia_(1687),_title,_p._5,_cropped.jpg"), "Isaac Newton, 1687", "kamu malı"),
    "sidereus": (COMMONS.format("Sidereus_Nuncius_Medicean_Stars.jpg"), "Galileo Galilei, 1610", "kamu malı"),
    "copernicus": (COMMONS.format("De_revolutionibus_1543.png"), "Nicolaus Copernicus, 1543", "kamu malı"),
    "istanbul": (COMMONS.format("Conquest_of_Constantinople,_Zonaro.jpg"), "Fausto Zonaro", "kamu malı"),
    "malazgirt": (COMMONS.format("131_Bataille_de_Malazgirt.jpg"), "Rohan Ustası (Boccaccio, De casibus)", "kamu malı"),
    "cuneiform": (COMMONS.format("Cuneiform_tablet-_student_exercise_tablet_MET_DP360672.jpg"), "The Metropolitan Museum of Art", "CC0"),
    "gobekli": (COMMONS.format("Göbekli_Tepe,_Urfa.jpg"), "Teomancimit", "CC BY-SA 3.0"),
}
MAX_W = 960


def write_history_images(raw_dir: Path, out_dir: Path) -> list[Path]:
    """İndir (varsa yeniden indirmez), en fazla 960 px genişliğe küçült, JPEG (q 82) olarak yaz."""
    out_dir.mkdir(parents=True, exist_ok=True)
    written = []
    for key, (url, _, _) in HISTORY_IMAGES.items():
        src = download(url, raw_dir / "history" / f"{key}{Path(url.split('?')[0]).suffix.lower() or '.jpg'}", timeout=120)
        im = Image.open(src).convert("RGB")
        if im.width > MAX_W:
            im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
        dest = out_dir / f"{key}.jpg"
        im.save(dest, "JPEG", quality=82, optimize=True, progressive=True)
        written.append(dest)
    return written
