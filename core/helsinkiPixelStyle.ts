/**
 * Helsinki Cathedral / Senate Square pixel-art style constants.
 * Targets the handcrafted isometric diorama reference (appendix + style guide).
 */
export const HELSINKI_PIXEL_STYLE = {
  palette: {
    // Warm off-whites (never pure white / never crushed black)
    cathedralWhite: 0xeee9d9,
    cathedralHighlight: 0xf5f0e2,
    cathedralShade: 0xb8b3a8,
    cathedralDeepShade: 0x96928b,

    domeHighlight: 0x57958b,
    domeBase: 0x34766e,
    domeShade: 0x204f4c,
    domeOutline: 0x183d3b,

    gold: 0xe7b94d,
    goldShade: 0x966c32,

    buildingYellow: 0xd8bd7c,
    buildingHighlight: 0xe6ce91,
    buildingShade: 0xb09058,

    roof: 0x34384a,
    roofHighlight: 0x45495a,
    roofShade: 0x252936,

    plazaA: 0xb9ad98,
    plazaB: 0xa39783,
    plazaHighlight: 0xd0c3aa,
    plazaShade: 0x817665,

    grass: 0x4a7a42,
    grassHighlight: 0x78a84c,
    grassShade: 0x294d32,

    water: 0x477baa,
    waterHighlight: 0x76a9c9,
    waterShade: 0x315b8c,

    shadow: 0x514b4a,

    treeDark: 0x24503b,
    treeMidDark: 0x347247,
    treeMidLight: 0x57934b,
    treeHighlight: 0x83b653,

    windowGlass: 0x2c3144,
    windowFrame: 0xe9d9b7,
    lampWarm: 0xe7b94d,

    muteWall: 0x9a9286,
    muteRoof: 0x3a3e4c,

    /** Lab diorama plate */
    labSky: 0xe8e0d4,
    labGround: 0xd4cbb8,
  },

  lighting: {
    sunDir: { x: -0.55, y: 0.75, z: -0.35 },
    hardShadows: true,
  },

  geometry: {
    domeSegments: 12,
    secondaryDomes: 4,
    facadeColumns: 12,
    stairTiers: 7,
    treeFoliageShades: 4,
  },

  shading: {
    topBrightness: 1.0,
    litSideBrightness: 0.92,
    shadeSideBrightness: 0.72,
  },

  muteRadiusMeters: 140,

  /** Slightly higher RT in lab so columns/dome ribs stay readable */
  labInternalWidth: 640,
  labInternalHeight: 360,
} as const;

export type HelsinkiPixelPalette = typeof HELSINKI_PIXEL_STYLE.palette;
