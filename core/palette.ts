import { HELSINKI_PIXEL_STYLE } from './helsinkiPixelStyle';

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

const H = HELSINKI_PIXEL_STYLE.palette;

/** Day palette locked to Helsinki pixel-art reference. */
export const PALETTES: Record<PresetName, PaletteColors> = {
  day: {
    sky: 0xc8d8e8,
    ground: H.grass,
    park: H.grassHighlight,
    water: H.water,
    road: 0x4a4a52,
    building: H.buildingYellow,
    roof: H.roof,
    windowLit: H.windowFrame,
    windowDark: H.windowGlass,
    outline: 0x2a2a32,
    ambient: 0xfff5e8,
    sun: 0xfff0d0,
    sunIntensity: 1.05,
    ambientIntensity: 0.55,
  },
  dusk: {
    sky: 0x3a4568,
    ground: H.grassShade,
    park: H.grass,
    water: H.waterShade,
    road: 0x2e2e34,
    building: H.buildingShade,
    roof: H.roofShade,
    windowLit: 0xffc86b,
    windowDark: 0x241820,
    outline: 0x08080e,
    ambient: 0xffa878,
    sun: 0xff7a50,
    sunIntensity: 0.75,
    ambientIntensity: 0.32,
  },
};

export function resolvePreset(raw: string | null): PresetName {
  return raw === 'dusk' ? 'dusk' : 'day';
}
