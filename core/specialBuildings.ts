import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshLambertMaterial,
  SphereGeometry,
  type Object3D,
} from 'three';
import type { LandmarkWorld } from './types';

/** Extra landmark silhouettes (no CityGML LoD2). Placed at landmark world xz. */
export function addSpecialLandmarks(scene: Object3D, landmarks: LandmarkWorld[]): Group {
  const root = new Group();
  root.name = 'special-landmarks';

  const wall = new MeshLambertMaterial({ color: 0xe8e0d0 });
  const dome = new MeshLambertMaterial({ color: 0x3d8f5a });
  const roof = new MeshLambertMaterial({ color: 0x6b5344 });
  const accent = new MeshLambertMaterial({ color: 0xc4b59a });

  for (const lm of landmarks) {
    if (!lm.special) continue;
    const g = new Group();
    g.position.set(lm.x, 0, lm.z);

    if (lm.special === 'cathedral') {
      // Base block + tall tower + green dome (recognizable Tuomiokirkko cue)
      const base = new Mesh(new BoxGeometry(28, 18, 36), wall);
      base.position.y = 9;
      const wingL = new Mesh(new BoxGeometry(14, 12, 14), wall);
      wingL.position.set(-16, 6, 0);
      const wingR = new Mesh(new BoxGeometry(14, 12, 14), wall);
      wingR.position.set(16, 6, 0);
      const tower = new Mesh(new BoxGeometry(10, 42, 10), wall);
      tower.position.y = 21 + 9;
      const cap = new Mesh(new SphereGeometry(7, 10, 8), dome);
      cap.position.y = 48;
      const cross = new Mesh(new BoxGeometry(1.2, 8, 1.2), accent);
      cross.position.y = 56;
      g.add(base, wingL, wingR, tower, cap, cross);
    } else if (lm.special === 'palace') {
      const body = new Mesh(new BoxGeometry(40, 22, 16), wall);
      body.position.y = 11;
      const top = new Mesh(new BoxGeometry(42, 3, 18), roof);
      top.position.y = 23.5;
      g.add(body, top);
    } else if (lm.special === 'university') {
      const body = new Mesh(new BoxGeometry(48, 20, 18), wall);
      body.position.y = 10;
      const colon = new Mesh(new BoxGeometry(46, 8, 4), accent);
      colon.position.set(0, 16, 10);
      g.add(body, colon);
    } else if (lm.special === 'library') {
      const body = new Mesh(new CylinderGeometry(14, 14, 16, 12), wall);
      body.position.y = 8;
      const lid = new Mesh(new CylinderGeometry(15, 15, 2, 12), roof);
      lid.position.y = 17;
      g.add(body, lid);
    }

    root.add(g);
  }

  scene.add(root);
  return root;
}
