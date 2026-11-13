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
    // Cream-tint sky / warm ground — match diorama day plate, not dark park green
    sky: 0xe8e2d6,
    ground: 0xb5a88f,
    park: 0x6a9458,
    water: H.water,
    road: 0x6a6a72,
    // Quiet LoD1 backdrop — special meshes carry the yellow
    building: H.muteWall,
    roof: H.muteRoof,
    windowLit: 0xc8c0b0,
    windowDark: H.windowGlass,
    outline: 0x2a2a32,
    ambient: 0xfff8ef,
    sun: 0xfff4e0,
    sunIntensity: 1.05,
    ambientIntensity: 0.72,
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
