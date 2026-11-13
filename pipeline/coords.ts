/** WGS84 lon/lat → EPSG:3879 (ETRS-GK25). Pipeline only — never import from core/. */
export function wgs84ToGk25(lonDeg: number, latDeg: number): { x: number; y: number } {
  const a = 6378137;
  const f = 1 / 298.257222101;
  const k0 = 1;
  const lon0 = (25 * Math.PI) / 180;
  const FE = 25500000;
  const FN = 0;
  const e2 = 2 * f - f * f;
  const ep2 = e2 / (1 - e2);
  const phi = (latDeg * Math.PI) / 180;
  const lam = (lonDeg * Math.PI) / 180;
  const s = Math.sin(phi);
  const c = Math.cos(phi);
  const t = Math.tan(phi);
  const N = a / Math.sqrt(1 - e2 * s * s);
  const T = t * t;
  const C = ep2 * c * c;
  const A = (lam - lon0) * c;
  const e4 = e2 * e2;
  const e6 = e4 * e2;
  const M =
    a *
    ((1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * phi -
      (3 * e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * phi) +
      (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * phi) -
      (35 * e6 / 3072) * Math.sin(6 * phi));
  const x =
    FE +
    k0 *
      N *
      (A +
        ((1 - T + C) * A ** 3) / 6 +
        ((5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5) / 120);
  const y =
    FN +
    k0 *
      (M +
        N *
          t *
          (A * A / 2 +
            ((5 - T + 9 * C + 4 * C * C) * A ** 4) / 24 +
            ((61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6) / 720));
  return { x, y };
}

/** Projected metres → world metres (x east, z south). */
export function toWorld(
  easting: number,
  northing: number,
  origin: { x: number; y: number },
): { x: number; z: number } {
  return { x: easting - origin.x, z: -(northing - origin.y) };
}
