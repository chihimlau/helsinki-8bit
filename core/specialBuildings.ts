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

/** Simple lollipop tree: thin trunk + 4-shade puff (upper-left light). */
function chunkyTree(x: number, z: number, H: number, seed = 1) {
  const g = new Group();
  g.position.set(x, 0, z);
  g.add(box(H * 0.07, H * 0.28, H * 0.07, flat(0x5a3a22), 0, H * 0.14, 0));

  const dark = flat(P.treeDark);
  const midD = flat(P.treeMidDark);
  const midL = flat(P.treeMidLight);
  const hi = flat(P.treeHighlight);

  const cy = H * 0.52;
  const r = H * 0.32;
  // Core + directional shade blobs
  const core = new Mesh(new SphereGeometry(r, 7, 6), midL);
  core.position.set(0, cy, 0);
  g.add(core);
  const shade = new Mesh(new SphereGeometry(r * 0.72, 6, 5), dark);
  shade.position.set(r * 0.28, cy - r * 0.15, r * 0.22);
  g.add(shade);
  const mid = new Mesh(new SphereGeometry(r * 0.55, 6, 5), midD);
  mid.position.set(r * 0.1, cy - r * 0.35, -r * 0.05);
  g.add(mid);
  // Upper-left highlights
  g.add(box(r * 0.55, r * 0.45, r * 0.55, hi, -r * 0.35, cy + r * 0.35, -r * 0.25));
  g.add(box(r * 0.35, r * 0.3, r * 0.35, hi, -r * 0.15, cy + r * 0.55, -r * 0.1));
  // Slight size jitter from seed without noisy clusters
  const s = 0.92 + (seed % 5) * 0.03;
  g.scale.set(s, s, s);
  return g;
}

function lampPost(x: number, z: number, h: number) {
  const g = new Group();
  g.position.set(x, 0, z);
  const shaft = flat(P.roof);
  const mid = flat(P.roofHighlight);
  const warm = flat(P.lampWarm);
  g.add(box(1.2, 1.2, 1.2, shaft, 0, 0.6, 0));
  g.add(box(0.55, h, 0.55, shaft, 0, 1.2 + h / 2, 0));
  g.add(box(1.5, 1.4, 1.5, shaft, 0, 1.2 + h + 0.7, 0));
  g.add(box(1.0, 1.0, 0.35, warm, 0, 1.2 + h + 0.7, 0.75));
  g.add(box(1.7, 0.4, 1.7, mid, 0, 1.2 + h + 1.6, 0));
  return g;
}

/** Dual-pitch roof: two rotated boxes meeting at ridge. */
function addGabledRoof(
  g: Group,
  width: number,
  depth: number,
  ridgeY: number,
  roofMat: Material,
  pitch = 0.38,
) {
  const half = depth * 0.52;
  const thick = 2.2;
  const len = Math.hypot(half, half * pitch) + 0.5;
  const angle = Math.atan2(half * pitch, half);
  const left = box(width + 2, thick, len, roofMat, 0, ridgeY, -half * 0.45);
  left.rotation.x = angle;
  g.add(left);
  const right = box(width + 2, thick, len, roofMat, 0, ridgeY, half * 0.45);
  right.rotation.x = -angle;
  g.add(right);
  // Ridge cap
  g.add(box(width + 2.5, 1.4, 2.2, roofMat, 0, ridgeY + half * pitch * 0.55, 0));
}

/**
 * Helsinki Cathedral — chunky silhouette, readable colonnade, quiet teal dome.
 */
function buildCathedral() {
  const W = 42;
  const g = new Group();

  const wall = createIsoCuboidMaterial({
    top: P.cathedralHighlight,
    sideLit: P.cathedralWhite,
    sideShade: P.cathedralShade,
    dither: 0.015,
  });
  const cool = createIsoCuboidMaterial({
    top: P.cathedralHighlight,
    sideLit: P.cathedralWhite,
    sideShade: 0xa8a49a,
    dither: 0.01,
  });
  const colLit = createIsoCuboidMaterial({
    top: P.cathedralHighlight,
    sideLit: P.cathedralHighlight,
    sideShade: P.cathedralShade,
    dither: 0,
  });
  const colShade = createIsoCuboidMaterial({
    top: P.cathedralWhite,
    sideLit: P.cathedralShade,
    sideShade: 0x9a968c,
    dither: 0,
  });
  const dome = createIsoCuboidMaterial({
    top: P.domeHighlight,
    sideLit: P.domeBase,
    sideShade: P.domeShade,
    dither: 0.02,
  });
  const domeDark = createIsoCuboidMaterial({
    top: P.domeBase,
    sideLit: P.domeShade,
    sideShade: P.domeOutline,
    dither: 0.01,
  });
  const gold = createIsoCuboidMaterial({
    top: 0xf4d274,
    sideLit: P.gold,
    sideShade: P.goldShade,
    dither: 0,
  });
  const stair = createIsoCuboidMaterial({
    top: P.plazaHighlight,
    sideLit: P.plazaA,
    sideShade: P.plazaShade,
    dither: 0.02,
  });

  // Foundation + terrace
  g.add(box(W, 0.1 * W, 0.75 * W, cool, 0, 0.05 * W, 0));
  g.add(box(1.2 * W, 0.12 * W, 0.58 * W, cool, 0, 0.12 * W, 0.12 * W));

  // Chunky stairs toward +Z (Senate Square)
  const tiers = G.stairTiers;
  for (let i = 0; i < tiers; i++) {
    const t = i / Math.max(tiers - 1, 1);
    const ww = 1.28 * W - t * 0.22 * W;
    const stepH = 0.035 * W;
    g.add(box(ww, stepH, 0.095 * W, stair, 0, 0.06 * W + i * stepH, 0.42 * W - i * 0.055 * W));
  }

  // Main body + cruciform
  g.add(box(W, 0.58 * W, 0.7 * W, wall, 0, 0.1 * W + 0.29 * W, 0));
  g.add(box(1.38 * W, 0.44 * W, 0.44 * W, wall, 0, 0.1 * W + 0.26 * W, 0));
  g.add(box(0.44 * W, 0.44 * W, 1.18 * W, wall, 0, 0.1 * W + 0.26 * W, 0));

  // Colonnade: fewer, thicker columns — alternate lit / shade
  const colH = 0.46 * W;
  const colD = 0.055 * W;
  const nCol = G.facadeColumns;
  for (let i = 0; i < nCol; i++) {
    const u = i / (nCol - 1);
    const x = (u - 0.5) * 0.88 * W;
    const mat = i % 2 === 0 ? colLit : colShade;
    g.add(box(colD, colH, colD * 1.1, mat, x, 0.14 * W + colH / 2, 0.38 * W));
  }
  // Pediment
  g.add(box(0.98 * W, 0.09 * W, 0.14 * W, cool, 0, 0.14 * W + colH + 0.05 * W, 0.38 * W));
  g.add(box(0.55 * W, 0.12 * W, 0.1 * W, cool, 0, 0.14 * W + colH + 0.14 * W, 0.4 * W));
  g.add(box(0.28 * W, 0.1 * W, 0.08 * W, cool, 0, 0.14 * W + colH + 0.22 * W, 0.41 * W));

  // Raised central block under drum
  g.add(box(0.7 * W, 0.14 * W, 0.54 * W, cool, 0, 0.1 * W + 0.58 * W + 0.07 * W, 0));

  // Drum + dome
  const drumY = 0.1 * W + 0.58 * W + 0.14 * W + 0.1 * W;
  g.add(box(0.38 * W, 0.28 * W, 0.38 * W, cool, 0, drumY + 0.14 * W, 0));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r = 0.21 * W;
    const mat = i % 2 === 0 ? colLit : colShade;
    g.add(box(0.04 * W, 0.24 * W, 0.04 * W, mat, Math.cos(a) * r, drumY + 0.12 * W, Math.sin(a) * r));
  }
  const ring = new Mesh(new CylinderGeometry(0.22 * W, 0.22 * W, 0.05 * W, G.domeSegments), cool);
  ring.position.set(0, drumY + 0.28 * W, 0);
  g.add(ring);

  const mainDome = new Mesh(new SphereGeometry(0.22 * W, G.domeSegments, 8), dome);
  mainDome.position.set(0, drumY + 0.28 * W + 0.12 * W, 0);
  g.add(mainDome);
  // Ribs
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.add(
      box(
        0.025 * W,
        0.26 * W,
        0.025 * W,
        domeDark,
        Math.cos(a) * 0.185 * W,
        drumY + 0.4 * W,
        Math.sin(a) * 0.185 * W,
      ),
    );
  }
  g.add(box(0.14 * W, 0.08 * W, 0.14 * W, domeDark, 0, drumY + 0.28 * W + 0.34 * W, 0));
  const finY = drumY + 0.28 * W + 0.4 * W;
  g.add(box(0.045 * W, 0.05 * W, 0.045 * W, gold, 0, finY, 0));
  g.add(box(0.028 * W, 0.14 * W, 0.028 * W, gold, 0, finY + 0.1 * W, 0));
  g.add(box(0.1 * W, 0.028 * W, 0.028 * W, gold, 0, finY + 0.12 * W, 0));

  // Four corner domes
  for (const [cx, cz] of [
    [-0.4 * W, -0.34 * W],
    [0.4 * W, -0.34 * W],
    [-0.4 * W, 0.3 * W],
    [0.4 * W, 0.3 * W],
  ] as const) {
    g.add(box(0.17 * W, 0.16 * W, 0.17 * W, cool, cx, 0.1 * W + 0.48 * W, cz));
    const d = new Mesh(new SphereGeometry(0.1 * W, 8, 6), dome);
    d.position.set(cx, 0.1 * W + 0.58 * W + 0.06 * W, cz);
    g.add(d);
    g.add(box(0.022 * W, 0.07 * W, 0.022 * W, gold, cx, 0.1 * W + 0.58 * W + 0.15 * W, cz));
  }

  // Hard cast shadow (purple-grey)
  const shMat = flat(P.shadow);
  shMat.transparent = true;
  shMat.opacity = 0.4;
  const sh = box(0.95 * W, 0.35, 0.7 * W, shMat, 0.12 * W, 0.2, 0.18 * W);
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
    dither: 0.015,
  });
  const plinth = createIsoCuboidMaterial({
    top: P.plazaHighlight,
    sideLit: P.plazaA,
    sideShade: P.plazaShade,
    dither: 0.01,
  });
  const statue = createIsoCuboidMaterial({
    top: 0x4a8f74,
    sideLit: 0x2f6a58,
    sideShade: 0x1c443c,
    dither: 0.01,
  });

  g.add(box(110, 0.7, 110, plaza, 0, 0.35, 0));
  for (let i = -5; i <= 5; i++) {
    g.add(box(9, 1.1, 9, curb, i * 10, 0.95, -52));
    g.add(box(9, 1.1, 9, curb, i * 10, 0.95, 52));
    g.add(box(9, 1.1, 9, curb, -52, 0.95, i * 10));
    g.add(box(9, 1.1, 9, curb, 52, 0.95, i * 10));
  }
  g.add(box(1.25 * W, 1.2, 8, curb, 0, 1.0, -42));

  g.add(box(0.55 * W, 2.5, 0.55 * W, plinth, 0, 1.5, 0));
  g.add(box(0.42 * W, 3.5, 0.42 * W, plinth, 0, 4.5, 0));
  g.add(box(0.28 * W, 5, 0.28 * W, plinth, 0, 8.5, 0));
  g.add(box(0.12 * W, 8, 0.1 * W, statue, 0, 15, 0));
  g.add(box(0.18 * W, 3, 0.12 * W, statue, 0, 20, 0));
  const head = new Mesh(new SphereGeometry(1.8, 6, 5), statue);
  head.position.set(0, 23, 0);
  g.add(head);

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

  const trees: Array<[number, number, number, number]> = [
    [-48, -48, 15, 1],
    [48, -48, 14, 2],
    [-48, 48, 16, 3],
    [48, 48, 15, 4],
    [-48, -10, 17, 5],
    [48, -10, 16, 6],
    [-48, 20, 15, 7],
    [48, 20, 14, 8],
    [-20, -50, 13, 9],
    [20, -50, 14, 10],
    [-35, 45, 14, 11],
    [35, 45, 13, 12],
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
    dither: 0.015,
  });
  const roof = createIsoCuboidMaterial({
    top: P.roofHighlight,
    sideLit: P.roof,
    sideShade: P.roofShade,
    dither: 0.01,
  });
  const glass = flat(P.windowGlass);
  g.add(box(56, 26, 22, wall, 0, 13, 0));
  addGabledRoof(g, 56, 22, 28, roof, 0.42);
  for (let row = 0; row < 3; row++) {
    for (let col = -4; col <= 4; col++) {
      g.add(box(2.0, 3.0, 0.35, glass, col * 5.5, 8 + row * 6, 11.2));
    }
  }
  for (let i = -4; i <= 4; i++) {
    g.add(box(2.0, 12, 2.0, flat(P.cathedralHighlight), i * 6, 14, 11.8));
  }
  return g;
}

function buildFlankingUniversity() {
  const g = new Group();
  const wall = createIsoCuboidMaterial({
    top: P.buildingHighlight,
    sideLit: P.buildingYellow,
    sideShade: P.buildingShade,
    dither: 0.015,
  });
  const roof = createIsoCuboidMaterial({
    top: P.roofHighlight,
    sideLit: P.roof,
    sideShade: P.roofShade,
    dither: 0.01,
  });
  g.add(box(64, 24, 22, wall, 0, 12, 0));
  addGabledRoof(g, 64, 22, 26, roof, 0.4);
  for (let i = -5; i <= 5; i++) {
    g.add(box(2, 14, 2, flat(P.cathedralHighlight), i * 5, 11, 11.8));
  }
  // Central pediment block
  g.add(box(22, 10, 10, wall, 0, 30, 0));
  g.add(box(24, 2.5, 12, roof, 0, 36, 0));
  return g;
}

function buildLibrary() {
  const g = new Group();
  const wall = createIsoCuboidMaterial({
    top: P.cathedralHighlight,
    sideLit: P.cathedralWhite,
    sideShade: P.cathedralShade,
    dither: 0.015,
  });
  const roof = createIsoCuboidMaterial({
    top: P.roofHighlight,
    sideLit: P.roof,
    sideShade: P.roofShade,
    dither: 0.01,
  });
  const dome = createIsoCuboidMaterial({
    top: P.domeHighlight,
    sideLit: P.domeBase,
    sideShade: P.domeShade,
    dither: 0.02,
  });
  g.add(box(36, 18, 28, wall, 0, 9, 0));
  const rotunda = new Mesh(new CylinderGeometry(14, 14, 18, 12), wall);
  rotunda.position.set(0, 18, 0);
  g.add(rotunda);
  const lid = new Mesh(new SphereGeometry(13, 10, 8), dome);
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
    dither: 0.015,
  });
  const roof = createIsoCuboidMaterial({
    top: P.roofHighlight,
    sideLit: P.roof,
    sideShade: P.roofShade,
    dither: 0.01,
  });
  g.add(box(70, 28, 30, wall, 0, 14, 0));
  addGabledRoof(g, 70, 30, 30, roof, 0.28);
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

/** Centers used to mute generic LoD1 near the diorama island. */
export function dioramaMuteCenters(landmarks: LandmarkWorld[]): Array<{ x: number; z: number; radius: number }> {
  const r = HELSINKI_PIXEL_STYLE.muteRadiusMeters;
  const out: Array<{ x: number; z: number; radius: number }> = [];
  for (const lm of landmarks) {
    if (lm.special === 'cathedral' || lm.id === 'hel-senate-square' || lm.special === 'palace' || lm.special === 'university') {
      out.push({ x: lm.x, z: lm.z, radius: r });
    }
  }
  return out;
}
