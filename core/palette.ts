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

/** Day / dusk sets tuned toward Warsaw-like contrast (readable roofs + parks). */
export const PALETTES: Record<PresetName, PaletteColors> = {
  day: {
    sky: 0xa8d4f0,
    ground: 0x6e9a5c,
    park: 0x4a8a40,
    water: 0x3a85c0,
    road: 0x55555a,
    building: 0xefe8dc,
    roof: 0x8a6548,
    windowLit: 0xe8f4ff,
    windowDark: 0x3a4a58,
    outline: 0x1a1a1a,
    ambient: 0xfff8f0,
    sun: 0xfff0d8,
    sunIntensity: 1.15,
    ambientIntensity: 0.62,
  },
  dusk: {
    sky: 0x3a4568,
    ground: 0x3a4e3c,
    park: 0x2a4530,
    water: 0x1a3858,
    road: 0x26262a,
    building: 0xc4a890,
    roof: 0x523828,
    windowLit: 0xffc86b,
    windowDark: 0x241820,
    outline: 0x08080e,
    ambient: 0xffa878,
    sun: 0xff7a50,
    sunIntensity: 0.78,
    ambientIntensity: 0.32,
  },
};

export function resolvePreset(raw: string | null): PresetName {
  return raw === 'dusk' ? 'dusk' : 'day';
}
