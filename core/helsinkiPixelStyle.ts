/**
 * Helsinki Cathedral / Senate Square pixel-art style constants.
 * Visual targets from style reference — apply to existing scene geometry only.
 */
export const HELSINKI_PIXEL_STYLE = {
  palette: {
    cathedralWhite: 0xe9e3d1,
    cathedralHighlight: 0xf5f0df,
    cathedralShade: 0xc9c5bb,

    domeHighlight: 0x57958b,
    domeBase: 0x34766e,
    domeShade: 0x204f4c,
    domeOutline: 0x183d3b,

    gold: 0xe7b94d,
    goldShade: 0x966c32,

    buildingYellow: 0xd9b978,
    buildingHighlight: 0xf0d79d,
    buildingShade: 0xa58a5d,

    roof: 0x34394f,
    roofHighlight: 0x55596c,
    roofShade: 0x252b3e,

    plazaA: 0xb9ad98,
    plazaB: 0xa39783,
    plazaHighlight: 0xd0c3aa,
    plazaShade: 0x817665,

    grass: 0x426f3d,
    grassHighlight: 0x78a84c,
    grassShade: 0x294d32,

    water: 0x477baa,
    waterHighlight: 0x76a9c9,
    waterShade: 0x315b8c,

    shadow: 0x343347,

    treeDark: 0x24503b,
    treeMidDark: 0x347247,
    treeMidLight: 0x57934b,
    treeHighlight: 0x83b653,

    windowGlass: 0x34394f,
    windowFrame: 0xe9d9b7,
    lampWarm: 0xe7b94d,
  },

  lighting: {
    /** Upper-left in world: +X east, +Y up, -Z north-ish for our dimetric */
    sunDir: { x: -0.55, y: 0.75, z: -0.35 },
    hardShadows: true,
  },

  geometry: {
    domeSegments: 12,
    secondaryDomes: 4,
    facadeColumns: 20,
    stairTiers: 10,
    treeFoliageShades: 4,
  },

  shading: {
    topBrightness: 1.0,
    litSideBrightness: 0.9,
    shadeSideBrightness: 0.7,
  },
} as const;

export type HelsinkiPixelPalette = typeof HELSINKI_PIXEL_STYLE.palette;
