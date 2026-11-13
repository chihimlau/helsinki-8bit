import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshLambertMaterial,
  SphereGeometry,
  type Material,
  type Object3D,
} from 'three';
import { HELSINKI_PIXEL_STYLE } from './helsinkiPixelStyle';
import { createIsoCuboidMaterial, createIsoPlazaMaterial } from './isoMaterials';
import type { LandmarkWorld } from './types';

const P = HELSINKI_PIXEL_STYLE.palette;
const G = HELSINKI_PIXEL_STYLE.geometry;

function flat(color: number) {
  return new MeshLambertMaterial({ color, flatShading: true });
}

function box(w: number, h: number, d: number, material: Material, x: number, y: number, z: number) {
  const m = new Mesh(new BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  return m;
}

/** Round chunky foliage: overlapping low-poly clusters, discrete greens (no smooth sphere look). */
function chunkyTree(x: number, z: number, H: number, seed = 1) {
  const g = new Group();
  g.position.set(x, 0, z);
  const trunk = flat(0x5a3a22);
  g.add(box(H * 0.09, H * 0.32, H * 0.09, trunk, 0, H * 0.16, 0));

  const shades = [P.treeDark, P.treeMidDark, P.treeMidLight, P.treeHighlight];
  const mats = shades.map((c) => flat(c));

  // Stacked offset clusters (boxes + low-seg spheres with flatShading)
  const clusters: Array<{ y: number; r: number; n: number; shadeBias: number }> = [
    { y: H * 0.38, r: H * 0.3, n: 6, shadeBias: 0 },
    { y: H * 0.55, r: H * 0.35, n: 7, shadeBias: 1 },
    { y: H * 0.72, r: H * 0.24, n: 5, shadeBias: 2 },
  ];

  let i = 0;
  for (const c of clusters) {
    for (let k = 0; k < c.n; k++) {
      const ang = (k / c.n) * Math.PI * 2 + seed * 0.7;
      const ox = Math.cos(ang) * c.r * 0.45;
      const oz = Math.sin(ang) * c.r * 0.45;
      const shadeIdx = Math.min(3, c.shadeBias + (oz > 0 ? 0 : 1) + (ox < 0 ? 1 : 0));
      const mat = mats[shadeIdx] ?? mats[1];
      // Chunky: mix flat boxes and low-poly spheres
      if ((k + seed) % 3 === 0) {
        const s = c.r * (0.55 + ((k + seed) % 5) * 0.06);
        g.add(box(s, s * 0.85, s, mat, ox, c.y, oz));
      } else {
        const sph = new Mesh(new SphereGeometry(c.r * 0.42, 6, 5), mat);
        sph.position.set(ox, c.y + ((k % 3) - 1) * H * 0.04, oz);
        g.add(sph);
      }
      i++;
    }
  }
  // Upper-left highlight blobs
  g.add(box(H * 0.16, H * 0.14, H * 0.16, mats[3], -H * 0.12, H * 0.78, -H * 0.08));
  g.add(box(H * 0.12, H * 0.1, H * 0.12, mats[3], -H * 0.05, H * 0.88, -H * 0.12));
  return g;
}

function lampPost(x: number, z: number, h: number) {
  const g = new Group();
  g.position.set(x, 0, z);
  const shaft = flat(P.roof);
  const mid = flat(P.roofHighlight);
  const warm = flat(P.lampWarm);
  g.add(box(1.2, 1.2, 1.2, shaft, 0, 0.6, 0));
  g.add(box(0.9, 1.0, 0.9, mid, 0, 1.5, 0));
  g.add(box(0.55, h, 0.55, shaft, 0, 1.5 + h / 2, 0));
  g.add(box(1.4, 1.6, 1.4, shaft, 0, 1.5 + h + 0.8, 0));
  g.add(box(1.0, 1.0, 0.3, warm, 0, 1.5 + h + 0.8, 0.7));
  g.add(box(1.6, 0.5, 1.6, mid, 0, 1.5 + h + 1.8, 0));
  return g;
}

/**
 * Helsinki Cathedral — proportions relative to body width W.
 * Anchored at landmark world position (real footprint preserved by skip + placement).
 */
function buildCathedral() {
  const W = 40;
  const g = new Group();

  const wall = createIsoCuboidMaterial({
    top: P.cathedralHighlight,
    sideLit: P.cathedralWhite,
    sideShade: P.cathedralShade,
    dither: 0.05,
  });
  const cool = createIsoCuboidMaterial({
    top: P.cathedralHighlight,
    sideLit: P.cathedralShade,
    sideShade: 0xaaa69e,
    dither: 0.04,
  });
  const dome = createIsoCuboidMaterial({
    top: P.domeHighlight,
    sideLit: P.domeBase,
    sideShade: P.domeShade,
    dither: 0.08,
  });
  const domeDark = createIsoCuboidMaterial({
    top: P.domeBase,
    sideLit: P.domeShade,
    sideShade: P.domeOutline,
    dither: 0.06,
  });
  const gold = createIsoCuboidMaterial({
    top: 0xf4d274,
    sideLit: P.gold,
    sideShade: P.goldShade,
    dither: 0.04,
  });
  const stair = createIsoCuboidMaterial({
    top: P.plazaHighlight,
    sideLit: P.plazaA,
    sideShade: P.plazaShade,
    dither: 0.07,
  });

  // 1 Foundation
  g.add(box(W, 0.08 * W, 0.72 * W, cool, 0, 0.04 * W, 0));
  // Terrace under stairs
  g.add(box(1.15 * W, 0.1 * W, 0.55 * W, cool, 0, 0.1 * W, 0.15 * W));

  // Stairs toward +Z (Senate Square) — 10 tiers
  const tiers = G.stairTiers;
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const ww = 1.25 * W - t * 0.15 * W;
    g.add(
      box(ww, (0.2 * W) / tiers, 0.08 * W, stair, 0, 0.05 * W + i * ((0.2 * W) / tiers), 0.38 * W + i * 0.07 * W),
    );
  }

  // 2 Main body
  g.add(box(W, 0.55 * W, 0.68 * W, wall, 0, 0.08 * W + 0.275 * W, 0));
  // Cruciform arms
  g.add(box(1.35 * W, 0.42 * W, 0.42 * W, wall, 0, 0.08 * W + 0.25 * W, 0));
  g.add(box(0.42 * W, 0.42 * W, 1.15 * W, wall, 0, 0.08 * W + 0.25 * W, 0));

  // Facade columns (~20) facing +Z
  const colH = 0.44 * W;
  const colD = 0.03 * W;
  for (let i = 0; i < G.facadeColumns; i++) {
    const u = i / (G.facadeColumns - 1);
    const x = (u - 0.5) * 0.9 * W;
    g.add(box(colD, colH, colD, cool, x, 0.12 * W + colH / 2, 0.36 * W));
  }
  // Portico / pediment
  g.add(box(0.95 * W, 0.08 * W, 0.12 * W, cool, 0, 0.12 * W + colH + 0.04 * W, 0.36 * W));
  g.add(box(0.7 * W, 0.1 * W, 0.08 * W, cool, 0, 0.12 * W + colH + 0.12 * W, 0.38 * W));

  // 3 Raised central roof
  g.add(box(0.68 * W, 0.12 * W, 0.52 * W, cool, 0, 0.08 * W + 0.55 * W + 0.06 * W, 0));

  // 4–7 Central drum + dome
  const drumY = 0.08 * W + 0.55 * W + 0.12 * W + 0.12 * W;
  g.add(box(0.36 * W, 0.25 * W, 0.36 * W, cool, 0, drumY + 0.125 * W, 0));
  // Drum columns ring
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const r = 0.2 * W;
    g.add(box(0.025 * W, 0.22 * W, 0.025 * W, cool, Math.cos(a) * r, drumY + 0.11 * W, Math.sin(a) * r));
  }
  const ring = new Mesh(new CylinderGeometry(0.21 * W, 0.21 * W, 0.04 * W, G.domeSegments), cool);
  ring.position.set(0, drumY + 0.26 * W, 0);
  g.add(ring);

  const mainDome = new Mesh(new SphereGeometry(0.215 * W, G.domeSegments, 10), dome);
  mainDome.position.set(0, drumY + 0.26 * W + 0.12 * W, 0);
  g.add(mainDome);
  // Meridian strips (segmentation)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const strip = box(0.02 * W, 0.28 * W, 0.02 * W, domeDark, Math.cos(a) * 0.18 * W, drumY + 0.38 * W, Math.sin(a) * 0.18 * W);
    g.add(strip);
  }
  g.add(box(0.12 * W, 0.07 * W, 0.12 * W, domeDark, 0, drumY + 0.26 * W + 0.32 * W, 0));
  // Gold finial + cross
  const finY = drumY + 0.26 * W + 0.38 * W;
  g.add(box(0.04 * W, 0.05 * W, 0.04 * W, gold, 0, finY, 0));
  g.add(box(0.025 * W, 0.13 * W, 0.025 * W, gold, 0, finY + 0.09 * W, 0));
  g.add(box(0.09 * W, 0.025 * W, 0.025 * W, gold, 0, finY + 0.11 * W, 0));

  // Four secondary domes
  const secR = 0.17 * W;
  for (const [cx, cz] of [
    [-0.38 * W, -0.32 * W],
    [0.38 * W, -0.32 * W],
    [-0.38 * W, 0.28 * W],
    [0.38 * W, 0.28 * W],
  ] as const) {
    g.add(box(0.16 * W, 0.14 * W, 0.16 * W, cool, cx, 0.08 * W + 0.45 * W, cz));
    const d = new Mesh(new SphereGeometry(secR * 0.55, 10, 8), dome);
    d.position.set(cx, 0.08 * W + 0.55 * W + 0.08 * W, cz);
    g.add(d);
    g.add(box(0.02 * W, 0.06 * W, 0.02 * W, gold, cx, 0.08 * W + 0.55 * W + 0.16 * W, cz));
  }

  // Soft cast shadow
  const shMat = flat(P.shadow);
  shMat.transparent = true;
  shMat.opacity = 0.45;
  const sh = new Mesh(new CylinderGeometry(0.7 * W, 0.85 * W, 0.4, 16), shMat);
  sh.position.set(0.08 * W, 0.25, 0.12 * W);
  g.add(sh);

  return g;
}

function buildSenateSquare() {
  const W = 40;
  const g = new Group();
  const plaza = createIsoPlazaMaterial();
  const curb = createIsoCuboidMaterial({
    top: P.plazaHighlight,
    sideLit: P.plazaA,
    sideShade: P.plazaShade,
    dither: 0.05,
  });
  const plinth = createIsoCuboidMaterial({
    top: P.plazaHighlight,
    sideLit: P.plazaA,
    sideShade: P.plazaShade,
    dither: 0.04,
  });
  const statue = createIsoCuboidMaterial({
    top: 0x43836b,
    sideLit: 0x285c4e,
    sideShade: 0x193e38,
    dither: 0.05,
  });

  // Full plaza plate (footprint-sized ~110m)
  g.add(box(110, 0.7, 110, plaza, 0, 0.35, 0));
  // Border curb tiles
  for (let i = -5; i <= 5; i++) {
    g.add(box(9, 1.1, 9, curb, i * 10, 0.95, -52));
    g.add(box(9, 1.1, 9, curb, i * 10, 0.95, 52));
    g.add(box(9, 1.1, 9, curb, -52, 0.95, i * 10));
    g.add(box(9, 1.1, 9, curb, 52, 0.95, i * 10));
  }
  // Stair approach border (toward cathedral / -Z)
  g.add(box(1.25 * W, 1.2, 8, curb, 0, 1.0, -42));

  // Statue plinth tiers
  g.add(box(0.55 * W, 2.5, 0.55 * W, plinth, 0, 1.5, 0));
  g.add(box(0.42 * W, 3.5, 0.42 * W, plinth, 0, 4.5, 0));
  g.add(box(0.28 * W, 5, 0.28 * W, plinth, 0, 8.5, 0));
  g.add(box(0.12 * W, 8, 0.1 * W, statue, 0, 15, 0));
  g.add(box(0.18 * W, 3, 0.12 * W, statue, 0, 20, 0));
  const head = new Mesh(new SphereGeometry(1.8, 6, 5), statue);
  head.position.set(0, 23, 0);
  g.add(head);

  // Lamp posts along edges
  const lamps: Array<[number, number]> = [
    [-40, -40],
    [40, -40],
    [-40, 40],
    [40, 40],
    [-40, 0],
    [40, 0],
    [0, 40],
    [-25, -40],
    [25, -40],
  ];
  for (const [lx, lz] of lamps) {
    g.add(lampPost(lx, lz, 0.12 * W));
  }

  // Perimeter trees (chunky round)
  const trees: Array<[number, number, number, number]> = [
    [-48, -48, 14, 1],
    [48, -48, 13, 2],
    [-48, 48, 15, 3],
    [48, 48, 14, 4],
    [-48, -10, 16, 5],
    [48, -10, 15, 6],
    [-48, 20, 14, 7],
    [48, 20, 13, 8],
    [-20, -50, 12, 9],
    [20, -50, 13, 10],
  ];
  for (const [tx, tz, h, seed] of trees) {
    g.add(chunkyTree(tx, tz, h, seed));
  }

  return g;
}

function buildFlankingPalace() {
  const g = new Group();
  const wall = createIsoCuboidMaterial({
    top: P.buildingHighlight,
    sideLit: P.buildingYellow,
    sideShade: P.buildingShade,
    dither: 0.05,
  });
  const roof = createIsoCuboidMaterial({
    top: P.roofHighlight,
    sideLit: P.roof,
    sideShade: P.roofShade,
    dither: 0.04,
  });
  const frame = flat(P.windowFrame);
  const glass = flat(P.windowGlass);
  g.add(box(56, 26, 22, wall, 0, 13, 0));
  g.add(box(58, 4, 24, roof, 0, 28, 0));
  // Windows grid
  for (let row = 0; row < 3; row++) {
    for (let col = -4; col <= 4; col++) {
      g.add(box(2.2, 3.2, 0.4, glass, col * 5.5, 8 + row * 6, 11.2));
      g.add(box(2.6, 3.6, 0.25, frame, col * 5.5, 8 + row * 6, 11.15));
    }
  }
  for (let i = -4; i <= 4; i++) {
    g.add(box(2.2, 12, 2.2, flat(P.cathedralHighlight), i * 6, 14, 12));
  }
  return g;
}

function buildFlankingUniversity() {
  const g = new Group();
  const wall = createIsoCuboidMaterial({
    top: P.buildingHighlight,
    sideLit: P.buildingYellow,
    sideShade: P.buildingShade,
    dither: 0.05,
  });
  const roof = createIsoCuboidMaterial({
    top: P.roofHighlight,
    sideLit: P.roof,
    sideShade: P.roofShade,
    dither: 0.04,
  });
  g.add(box(64, 24, 22, wall, 0, 12, 0));
  g.add(box(66, 3.5, 24, roof, 0, 25.5, 0));
  for (let i = -5; i <= 5; i++) {
    g.add(box(2, 14, 2, flat(P.cathedralHighlight), i * 5, 11, 12));
  }
  g.add(box(24, 12, 12, wall, 0, 30, 0));
  return g;
}

function buildLibrary() {
  const g = new Group();
  const wall = createIsoCuboidMaterial({
    top: P.cathedralHighlight,
    sideLit: P.cathedralWhite,
    sideShade: P.cathedralShade,
  });
  const roof = createIsoCuboidMaterial({
    top: P.roofHighlight,
    sideLit: P.roof,
    sideShade: P.roofShade,
  });
  const dome = createIsoCuboidMaterial({
    top: P.domeHighlight,
    sideLit: P.domeBase,
    sideShade: P.domeShade,
  });
  g.add(box(36, 18, 28, wall, 0, 9, 0));
  const rotunda = new Mesh(new CylinderGeometry(14, 14, 18, 12), wall);
  rotunda.position.set(0, 18, 0);
  g.add(rotunda);
  const lid = new Mesh(new SphereGeometry(13, 12, 10), dome);
  lid.scale.set(1, 0.5, 1);
  lid.position.set(0, 28, 0);
  g.add(lid);
  g.add(box(38, 2.5, 30, roof, 0, 18, 0));
  return g;
}

function buildSquareSimple() {
  const g = new Group();
  g.add(box(70, 0.6, 70, createIsoPlazaMaterial(), 0, 0.35, 0));
  return g;
}

function buildStation() {
  const g = new Group();
  const wall = createIsoCuboidMaterial({
    top: P.cathedralHighlight,
    sideLit: P.cathedralWhite,
    sideShade: P.cathedralShade,
  });
  const roof = createIsoCuboidMaterial({
    top: P.roofHighlight,
    sideLit: P.roof,
    sideShade: P.roofShade,
  });
  g.add(box(70, 28, 30, wall, 0, 14, 0));
  g.add(box(74, 5, 34, roof, 0, 30, 0));
  g.add(box(12, 40, 12, wall, -28, 20, 10));
  g.add(box(12, 40, 12, wall, 28, 20, 10));
  return g;
}

/** Special landmark meshes — geography from landmark xz; style from HELSINKI_PIXEL_STYLE. */
export function addSpecialLandmarks(scene: Object3D, landmarks: LandmarkWorld[]): Group {
  const root = new Group();
  root.name = 'special-landmarks';

  for (const lm of landmarks) {
    if (!lm.special) continue;
    const g = new Group();
    g.position.set(lm.x, 0, lm.z);
    g.name = lm.id;

    if (lm.special === 'cathedral') {
      g.add(buildCathedral());
    } else if (lm.special === 'palace') {
      g.add(buildFlankingPalace());
    } else if (lm.special === 'university') {
      g.add(buildFlankingUniversity());
    } else if (lm.special === 'library') {
      g.add(buildLibrary());
    } else if (lm.special === 'square') {
      if (lm.id === 'hel-senate-square') g.add(buildSenateSquare());
      else g.add(buildSquareSimple());
    } else if (lm.special === 'station') {
      g.add(buildStation());
    }

    root.add(g);
  }

  scene.add(root);
  return root;
}
