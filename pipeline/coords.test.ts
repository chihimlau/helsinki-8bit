import { describe, expect, it } from 'vitest';
import { toWorld, wgs84ToGk25 } from './coords';

describe('wgs84ToGk25', () => {
  it('places Senate Square near known GK25 easting/northing', () => {
    const p = wgs84ToGk25(24.9525, 60.1699);
    expect(p.x).toBeGreaterThan(25497000);
    expect(p.x).toBeLessThan(25498000);
    expect(p.y).toBeGreaterThan(6672500);
    expect(p.y).toBeLessThan(6673500);
    expect(Math.round(p.x)).toBe(25497363);
    expect(Math.round(p.y)).toBe(6673003);
  });
});

describe('toWorld', () => {
  it('subtracts origin with z pointing south', () => {
    const origin = { x: 25497363, y: 6673003 };
    const w = toWorld(25497363 + 10, 6673003 + 20, origin);
    expect(w.x).toBeCloseTo(10);
    expect(w.z).toBeCloseTo(-20);
  });
});
