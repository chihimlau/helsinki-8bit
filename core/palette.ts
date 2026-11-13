export type PaletteColors = {
  sky: number;
  ground: number;
  park: number;
  water: number;
  road: number;
  building: number;
  roof: number;
  windowLit: number;
  windowDark: number;
  outline: number;
  ambient: number;
  sun: number;
  sunIntensity: number;
  ambientIntensity: number;
};

export type PresetName = 'day' | 'dusk';

/** Helsinki day / dusk 16-ish colour sets (locked for M2). */
export const PALETTES: Record<PresetName, PaletteColors> = {
  day: {
    sky: 0x7ec8e3,
    ground: 0x6b8f5e,
    park: 0x4e7a45,
    water: 0x2e6fa0,
    road: 0x4a4a4a,
    building: 0xd6cfc0,
    roof: 0x8b7355,
    windowLit: 0xc9e7ff,
    windowDark: 0x3a4a55,
    outline: 0x1a1a1a,
    ambient: 0xfff5e6,
    sun: 0xfff0d0,
    sunIntensity: 0.95,
    ambientIntensity: 0.55,
  },
  dusk: {
    sky: 0x3d4a6b,
    ground: 0x3d5240,
    park: 0x2f4a32,
    water: 0x1e3f5c,
    road: 0x2e2e32,
    building: 0xb8a090,
    roof: 0x5c4030,
    windowLit: 0xffc86b,
    windowDark: 0x2a2030,
    outline: 0x0a0a12,
    ambient: 0xffb080,
    sun: 0xff8a5c,
    sunIntensity: 0.7,
    ambientIntensity: 0.35,
  },
};

export function resolvePreset(raw: string | null): PresetName {
  return raw === 'dusk' ? 'dusk' : 'day';
}
