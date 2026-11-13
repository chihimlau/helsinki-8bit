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

/** Chunky round canopy: short trunk + offset foliage clusters, 4 greens, upper-left light. */
function chunkyTree(x: number, z: number, H: number, seed = 1) {
  const g = new Group();
  g.position.set(x, 0, z);
  g.add(box(H * 0.06, H * 0.26, H * 0.06, flat(0x5a3a22), 0, H * 0.13, 0));

  const mats = [flat(P.treeDark), flat(P.treeMidDark), flat(P.treeMidLight), flat(P.treeHighlight)];
  const cy = H * 0.5;
  const r = H * 0.36;

  // Large mid clusters
  const big: Array<[number, number, number, number, number]> = [
    [0, cy, 0, r, 2],
    [r * 0.35, cy - r * 0.12, r * 0.28, r * 0.7, 0],
    [-r * 0.32, cy + r * 0.08, -r * 0.22, r * 0.62, 3],
    [r * 0.12, cy - r * 0.28, -r * 0.18, r * 0.55, 1],
    [-r * 0.18, cy - r * 0.05, r * 0.32, r * 0.5, 1],
    [r * 0.22, cy + r * 0.22, r * 0.05, r * 0.42, 3],
    [-r * 0.05, cy + r * 0.3, -r * 0.05, r * 0.38, 2],
  ];
  for (const [ox, oy, oz, rr, shade] of big) {
    const sph = new Mesh(new SphereGeometry(rr, 7, 5), mats[shade] ?? mats[2]);
    sph.position.set(ox, oy, oz);
    g.add(sph);
  }
  // Edge nubs for irregular silhouette
  const nubs = 3 + (seed % 3);
  for (let i = 0; i < nubs; i++) {
    const a = (i / nubs) * Math.PI * 2 + seed * 0.4;
    const nr = r * (0.28 + (i % 3) * 0.04);
    g.add(
      box(
        nr * 1.2,
        nr,
        nr * 1.2,
        mats[i % 2 === 0 ? 3 : 1],
        Math.cos(a) * r * 0.55,
        cy + Math.sin(a * 1.3) * r * 0.15,
        Math.sin(a) * r * 0.55,
      ),
    );
  }
  // Explicit upper-left highlight blobs
  g.add(box(r * 0.5, r * 0.4, r * 0.5, mats[3], -r * 0.4, cy + r * 0.4, -r * 0.28));
  g.add(box(r * 0.32, r * 0.28, r * 0.32, mats[3], -r * 0.18, cy + r * 0.58, -r * 0.12));

  const s = 0.94 + (seed % 4) * 0.03;
  g.scale.set(s, s * 0.95, s);
  return g;
}

function lampPost(x: number, z: number, h: number) {
  const g = new Group();
  g.position.set(x, 0, z);
  const shaft = flat(P.roof);
  const warm = flat(P.lampWarm);
  g.add(box(0.9, 0.9, 0.9, shaft, 0, 0.45, 0));
  g.add(box(0.4, h, 0.4, shaft, 0, 0.9 + h / 2, 0));
  g.add(box(1.1, 1.0, 1.1, shaft, 0, 0.9 + h + 0.5, 0));
  g.add(box(0.7, 0.7, 0.25, warm, 0, 0.9 + h + 0.5, 0.55));
  return g;
}

function addGabledRoof(
  g: Group,
  width: number,
  depth: number,
  ridgeY: number,
  roofMat: Material,
  pitch = 0.4,
) {
  const half = depth * 0.5;
  const thick = 2.0;
  const len = Math.hypot(half, half * pitch) + 0.4;
  const angle = Math.atan2(half * pitch, half);
  const left = box(width + 2, thick, len, roofMat, 0, ridgeY, -half * 0.42);
  left.rotation.x = angle;
  g.add(left);
  const right = box(width + 2, thick, len, roofMat, 0, ridgeY, half * 0.42);
  right.rotation.x = -angle;
  g.add(right);
  g.add(box(width + 2.4, 1.2, 2.0, roofMat, 0, ridgeY + half * pitch * 0.5, 0));
}

/**
 * Helsinki Cathedral — A3 silhouette: wide body, colonnade, large teal dome.
 * Relative to facade width W; anchored at landmark world position.
 */
function buildCathedral() {
  const W = 48;
  const g = new Group();

  const wall = createIsoCuboidMaterial({
    top: P.cathedralHighlight,
    sideLit: P.cathedralWhite,
    sideShade: P.cathedralShade,
    dither: 0.01,
  });
  const cool = createIsoCuboidMaterial({
    top: P.cathedralHighlight,
    sideLit: P.cathedralWhite,
    sideShade: P.cathedralDeepShade,
    dither: 0.008,
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
    sideShade: P.cathedralDeepShade,
    dither: 0,
  });
  const dome = createIsoCuboidMaterial({
    top: P.domeHighlight,
    sideLit: P.domeBase,
    sideShade: P.domeShade,
    dither: 0.015,
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
    dither: 0.015,
  });
  const roofMass = createIsoCuboidMaterial({
    top: P.domeBase,
    sideLit: P.domeShade,
    sideShade: P.domeOutline,
    dither: 0.01,
  });

  // 01 Stepped plinth
  g.add(box(1.05 * W, 0.08 * W, 0.82 * W, cool, 0, 0.04 * W, 0.02 * W));
  g.add(box(0.98 * W, 0.07 * W, 0.72 * W, cool, 0, 0.1 * W, 0));

  // Stairs toward +Z (Square) — 7 readable tiers
  const tiers = G.stairTiers;
  for (let i = 0; i < tiers; i++) {
    const t = i / Math.max(tiers - 1, 1);
    const ww = 1.15 * W - t * 0.18 * W;
    const stepH = 0.04 * W;
    g.add(
      box(ww, stepH, 0.1 * W, stair, 0, 0.05 * W + i * stepH, 0.48 * W - i * 0.065 * W),
    );
  }

  // 02 Main cruciform body — wide, not a thin tower (height ~0.65W)
  const bodyH = 0.62 * W;
  const bodyY = 0.12 * W + bodyH / 2;
  g.add(box(W, bodyH, 0.72 * W, wall, 0, bodyY, 0));
  g.add(box(1.32 * W, bodyH * 0.78, 0.42 * W, wall, 0, 0.12 * W + (bodyH * 0.78) / 2, 0));
  g.add(box(0.42 * W, bodyH * 0.78, 1.05 * W, wall, 0, 0.12 * W + (bodyH * 0.78) / 2, 0));

  // 03 Colonnade facing +Z — thick, alternating lit/shade, with base + capital
  const colH = 0.22 * W;
  const colD = 0.055 * W;
  const nCol = G.facadeColumns;
  const facadeZ = 0.4 * W;
  const colBaseY = 0.14 * W;
  for (let i = 0; i < nCol; i++) {
    const u = i / (nCol - 1);
    const x = (u - 0.5) * 0.86 * W;
    const mat = i % 2 === 0 ? colLit : colShade;
    g.add(box(colD * 1.35, 0.025 * W, colD * 1.35, cool, x, colBaseY, facadeZ));
    g.add(box(colD, colH, colD * 1.15, mat, x, colBaseY + 0.012 * W + colH / 2, facadeZ));
    g.add(box(colD * 1.4, 0.03 * W, colD * 1.4, cool, x, colBaseY + 0.012 * W + colH + 0.015 * W, facadeZ));
  }
  // Cornice + pediment
  const pedY = colBaseY + 0.012 * W + colH + 0.05 * W;
  g.add(box(0.92 * W, 0.06 * W, 0.12 * W, cool, 0, pedY, facadeZ));
  g.add(box(0.7 * W, 0.08 * W, 0.1 * W, cool, 0, pedY + 0.07 * W, facadeZ + 0.01 * W));
  g.add(box(0.4 * W, 0.09 * W, 0.08 * W, cool, 0, pedY + 0.14 * W, facadeZ + 0.02 * W));
  g.add(box(0.18 * W, 0.07 * W, 0.06 * W, cool, 0, pedY + 0.2 * W, facadeZ + 0.02 * W));

  // 04 Roof masses (teal contrast blocks under drum)
  const roofY = 0.12 * W + bodyH + 0.04 * W;
  g.add(box(0.72 * W, 0.1 * W, 0.55 * W, roofMass, 0, roofY, 0));
  g.add(box(0.55 * W, 0.08 * W, 0.42 * W, cool, 0, roofY + 0.08 * W, 0));

  // 05 Central drum (~0.26W diameter)
  const drumD = 0.26 * W;
  const drumH = 0.2 * W;
  const drumY = roofY + 0.12 * W;
  g.add(box(drumD, drumH, drumD, cool, 0, drumY + drumH / 2, 0));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const rr = drumD * 0.48;
    const mat = i % 2 === 0 ? colLit : colShade;
    g.add(box(0.035 * W, drumH * 0.85, 0.035 * W, mat, Math.cos(a) * rr, drumY + drumH * 0.45, Math.sin(a) * rr));
  }
  const ring = new Mesh(new CylinderGeometry(drumD * 0.52, drumD * 0.52, 0.04 * W, G.domeSegments), cool);
  ring.position.set(0, drumY + drumH, 0);
  g.add(ring);

  // 06 Main dome — LARGE (~0.32W diameter) teal segmented
  const domeR = 0.16 * W;
  const domeY = drumY + drumH + domeR * 0.55;
  const mainDome = new Mesh(new SphereGeometry(domeR, G.domeSegments, 10), dome);
  mainDome.position.set(0, domeY, 0);
  g.add(mainDome);
  // Ribs + bands
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(
      box(0.022 * W, domeR * 1.35, 0.022 * W, domeDark, Math.cos(a) * domeR * 0.82, domeY + domeR * 0.1, Math.sin(a) * domeR * 0.82),
    );
  }
  g.add(box(domeR * 1.1, 0.035 * W, domeR * 1.1, domeDark, 0, domeY + domeR * 0.15, 0));
  g.add(box(0.12 * W, 0.06 * W, 0.12 * W, domeDark, 0, domeY + domeR * 0.85, 0));

  // 08 Gold finial + cross
  const finY = domeY + domeR * 1.05;
  g.add(box(0.04 * W, 0.045 * W, 0.04 * W, gold, 0, finY, 0));
  g.add(box(0.025 * W, 0.14 * W, 0.025 * W, gold, 0, finY + 0.1 * W, 0));
  g.add(box(0.1 * W, 0.025 * W, 0.025 * W, gold, 0, finY + 0.12 * W, 0));

  // 07 Four secondary domes
  for (const [cx, cz] of [
    [-0.38 * W, -0.3 * W],
    [0.38 * W, -0.3 * W],
    [-0.38 * W, 0.28 * W],
    [0.38 * W, 0.28 * W],
  ] as const) {
    g.add(box(0.16 * W, 0.14 * W, 0.16 * W, cool, cx, roofY + 0.02 * W, cz));
    const d = new Mesh(new SphereGeometry(0.09 * W, 10, 8), dome);
    d.position.set(cx, roofY + 0.14 * W, cz);
    g.add(d);
    g.add(box(0.02 * W, 0.07 * W, 0.02 * W, gold, cx, roofY + 0.22 * W, cz));
  }

  // Soft coloured cast shadow (not pure black)
  const shMat = flat(P.shadow);
  shMat.transparent = true;
  shMat.opacity = 0.35;
  g.add(box(0.9 * W, 0.3, 0.65 * W, shMat, 0.1 * W, 0.2, 0.15 * W));

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
    dither: 0.01,
  });
  const plinth = createIsoCuboidMaterial({
    top: P.plazaHighlight,
    sideLit: P.plazaA,
    sideShade: P.plazaShade,
    dither: 0.008,
  });
  const statue = createIsoCuboidMaterial({
    top: 0x4a8f74,
    sideLit: 0x2f6a58,
    sideShade: 0x1c443c,
    dither: 0.01,
  });

  g.add(box(118, 0.7, 118, plaza, 0, 0.35, 0));
  for (let i = -5; i <= 5; i++) {
    g.add(box(8, 1.0, 8, curb, i * 10.5, 0.9, -56));
    g.add(box(8, 1.0, 8, curb, i * 10.5, 0.9, 56));
    g.add(box(8, 1.0, 8, curb, -56, 0.9, i * 10.5));
    g.add(box(8, 1.0, 8, curb, 56, 0.9, i * 10.5));
  }

  // Statue: 3–4 clear stepped plinths
  g.add(box(0.5 * W, 2.2, 0.5 * W, plinth, 0, 1.4, 0));
  g.add(box(0.38 * W, 3.0, 0.38 * W, plinth, 0, 4.0, 0));
  g.add(box(0.26 * W, 4.5, 0.26 * W, plinth, 0, 7.8, 0));
  g.add(box(0.14 * W, 2.0, 0.14 * W, plinth, 0, 11.5, 0));
  g.add(box(0.1 * W, 7, 0.08 * W, statue, 0, 16, 0));
  g.add(box(0.16 * W, 2.8, 0.1 * W, statue, 0, 20.5, 0));
  const head = new Mesh(new SphereGeometry(1.6, 6, 5), statue);
  head.position.set(0, 23, 0);
  g.add(head);

  const lamps: Array<[number, number]> = [
    [-42, -42],
    [42, -42],
    [-42, 42],
    [42, 42],
    [-42, 0],
    [42, 0],
    [0, 42],
    [-22, -42],
    [22, -42],
  ];
  for (const [lx, lz] of lamps) {
    g.add(lampPost(lx, lz, 10));
  }

  const trees: Array<[number, number, number, number]> = [
    [-50, -50, 16, 1],
    [50, -50, 15, 2],
    [-50, 50, 17, 3],
    [50, 50, 16, 4],
    [-50, -12, 18, 5],
    [50, -12, 17, 6],
    [-50, 18, 16, 7],
    [50, 18, 15, 8],
    [-22, -52, 14, 9],
    [22, -52, 15, 10],
    [-36, 48, 15, 11],
    [36, 48, 14, 12],
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
    dither: 0.012,
  });
  const roof = createIsoCuboidMaterial({
    top: P.roofHighlight,
    sideLit: P.roof,
    sideShade: P.roofShade,
    dither: 0.01,
  });
  const glass = flat(P.windowGlass);
  g.add(box(58, 26, 22, wall, 0, 13, 0));
  addGabledRoof(g, 58, 22, 28, roof, 0.42);
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
    dither: 0.012,
  });
  const roof = createIsoCuboidMaterial({
    top: P.roofHighlight,
    sideLit: P.roof,
    sideShade: P.roofShade,
    dither: 0.01,
  });
  g.add(box(66, 24, 22, wall, 0, 12, 0));
  addGabledRoof(g, 66, 22, 26, roof, 0.4);
  for (let i = -5; i <= 5; i++) {
    g.add(box(2, 14, 2, flat(P.cathedralHighlight), i * 5, 11, 11.8));
  }
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
    dither: 0.012,
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
    dither: 0.015,
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
    dither: 0.012,
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

/** Lab island: only the Senate Square diorama landmarks (by stable id). */
const LAB_LANDMARK_IDS = new Set([
  'hel-senate-square',
  'hel-helsinki-cathedral',
  'hel-government-palace',
  'hel-university-main-building',
]);

/** Special landmark meshes — geography from landmark xz; style from HELSINKI_PIXEL_STYLE. */
export function addSpecialLandmarks(
  scene: Object3D,
  landmarks: LandmarkWorld[],
  opts?: { labMode?: boolean },
): Group {
  const root = new Group();
  root.name = 'special-landmarks';
  const lab = !!opts?.labMode;

  for (const lm of landmarks) {
    if (!lm.special) continue;
    if (lab && !LAB_LANDMARK_IDS.has(lm.id)) continue;

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

export function dioramaMuteCenters(
  landmarks: LandmarkWorld[],
): Array<{ x: number; z: number; radius: number }> {
  const r = HELSINKI_PIXEL_STYLE.muteRadiusMeters;
  const out: Array<{ x: number; z: number; radius: number }> = [];
  for (const lm of landmarks) {
    if (
      lm.special === 'cathedral' ||
      lm.id === 'hel-senate-square' ||
      lm.special === 'palace' ||
      lm.special === 'university'
    ) {
      out.push({ x: lm.x, z: lm.z, radius: r });
    }
  }
  return out;
}
