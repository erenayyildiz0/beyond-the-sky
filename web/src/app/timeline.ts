/** Bütün süreler ve ayar sabitleri (SPEC §6.2). Sahneler süre sabit kodlamaz. */
export const T = {
  act1: { introText: 4, hold: 7.0, release: 3.5, reveal: [0.8, 2.5, 3.0] },
  act2: {
    takeoff: { turn: 1.5, fadeOut: 0.8, fadeIn: 1.0 },
    vMax: 0.8,                 // onluk/sn (z birimi)
    accelTau: 0.4, decelTau: 0.6,
    detentZ: 0.15, detentFactor: 0.35,
    cardWindowZ: 0.18,
    flyToS: 3.0, idleHintS: 6, autoplayDwellS: 5,
    lookTurnS: 1.5,
  },
  act3: { returnS: 14, landHold: 4, lightsOnS: 6 },
  outro: { lineGap: 2.5, total: 10 },
  fadeMs: 500,
  look: { inertiaTau: 0.25, breathYawDeg: 0.4, breathPeriodS: 40, minAltDeg: -5, maxAltDeg: 88, arrowDegPerS: 40 },
};
