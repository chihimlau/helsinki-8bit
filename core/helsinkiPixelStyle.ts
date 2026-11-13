/**
 * Helsinki Cathedral / Senate Square pixel-art style constants.
 * Visual targets from style reference — apply to existing scene geometry only.
 */
export const HELSINKI_PIXEL_STYLE = {
  palette: {
    cathedralWhite: 0xf2ece0,
    cathedralHighlight: 0xfaf6ee,
    cathedralShade: 0xc4bfb4,

    domeHighlight: 0x5fa398,
    domeBase: 0x3a7f76,
    domeShade: 0x245a55,
    domeOutline: 0x1a4542,

    gold: 0xe7b94d,
    goldShade: 0x966c32,

    buildingYellow: 0xe2c58a,
    buildingHighlight: 0xf3d9a4,
    buildingShade: 0xb09058,

    roof: 0x2f3448,
    roofHighlight: 0x4a5064,
    roofShade: 0x1e2333,

    plazaA: 0xc9bda6,
    plazaB: 0xb8ab94,
    plazaHighlight: 0xddd0b8,
    plazaShade: 0x8f8370,

    grass: 0x4a7a42,
    grassHighlight: 0x7eae52,
    grassShade: 0x2f5236,

    water: 0x477baa,
    waterHighlight: 0x76a9c9,
    waterShade: 0x315b8c,

    shadow: 0x3a3850,

    treeDark: 0x24503b,
    treeMidDark: 0x347247,
    treeMidLight: 0x57934b,
    treeHighlight: 0x8fbf58,

    windowGlass: 0x2c3144,
    windowFrame: 0xe9d9b7,
    lampWarm: 0xe7b94d,

    /** Quiet LoD1 backdrop — must not compete with special meshes */
    muteWall: 0x9a9286,
    muteRoof: 0x3a3e4c,
  },

  lighting: {
    /** Upper-left in world: +X east, +Y up, -Z north-ish for our dimetric */
    sunDir: { x: -0.55, y: 0.75, z: -0.35 },
    hardShadows: true,
  },

  geometry: {
    domeSegments: 10,
    secondaryDomes: 4,
    facadeColumns: 14,
    stairTiers: 8,
    treeFoliageShades: 4,
  },

  shading: {
    topBrightness: 1.0,
    litSideBrightness: 0.9,
    shadeSideBrightness: 0.7,
  },

  /** Hide generic footprints near Square / Cathedral so special meshes read */
  muteRadiusMeters: 130,
} as const;

export type HelsinkiPixelPalette = typeof HELSINKI_PIXEL_STYLE.palette;
