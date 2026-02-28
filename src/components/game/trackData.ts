import * as THREE from 'three';

export const ROAD_WIDTH = 18;
export const TOTAL_LAPS = 3;
export const MAX_SPEED = 65;
export const ACCEL = 30;
export const BRAKE_FORCE = 20;
export const TURN_RATE = 2.0;

export const CAR_COLORS = [
  '#dc2626', '#2563eb', '#16a34a', '#eab308',
  '#9333ea', '#f97316', '#06b6d4', '#ec4899',
];

export const CAR_NAMES = [
  'Blaze Red', 'Sapphire', 'Venom', 'Gold Rush',
  'Phantom', 'Inferno', 'Glacier', 'Fuchsia',
];

export const AI_TARGET_SPEEDS = [52, 48, 45, 42, 50, 46, 44];

/** Create a long, winding circuit that takes 3-5 minutes */
export function createTrackCurve(): THREE.CatmullRomCurve3 {
  const waypoints: [number, number][] = [
    [0, -140],
    [40, -145],
    [80, -135],
    [120, -110],
    [145, -75],
    [155, -35],
    [155, 10],
    [150, 50],
    [135, 85],
    [110, 110],
    [80, 125],
    [45, 135],
    [5, 140],
    [-35, 138],
    [-70, 128],
    [-100, 108],
    [-125, 80],
    [-140, 48],
    [-148, 10],
    [-148, -30],
    [-140, -65],
    [-125, -95],
    [-100, -115],
    [-70, -128],
    [-35, -138],
  ];

  const pts = waypoints.map(([x, z]) => new THREE.Vector3(x, 0, z));
  return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
}

/** Build a flat ribbon road geometry following the track curve */
export function createRoadGeometry(curve: THREE.CatmullRomCurve3): THREE.BufferGeometry {
  const segments = 600;
  const hw = ROAD_WIDTH / 2;
  const verts: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = curve.getPointAt(t);
    const tang = curve.getTangentAt(t);
    const normal = new THREE.Vector3(-tang.z, 0, tang.x).normalize();

    const left = p.clone().add(normal.clone().multiplyScalar(hw));
    const right = p.clone().add(normal.clone().multiplyScalar(-hw));

    verts.push(left.x, 0.01, left.z, right.x, 0.01, right.z);
    uvs.push(0, t * 60, 1, t * 60);

    if (i < segments) {
      const b = i * 2;
      indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Find nearest point on the track curve */
export function getTrackDistance(pos: THREE.Vector3, curve: THREE.CatmullRomCurve3): number {
  let bestDist = Infinity;
  for (let i = 0; i < 600; i++) {
    const t = i / 600;
    const d = pos.distanceTo(curve.getPointAt(t));
    if (d < bestDist) bestDist = d;
  }
  return bestDist;
}

/** Get track parameter t for a position */
export function getTrackT(pos: THREE.Vector3, curve: THREE.CatmullRomCurve3): number {
  let bestDist = Infinity;
  let bestT = 0;
  for (let i = 0; i < 600; i++) {
    const t = i / 600;
    const d = pos.distanceTo(curve.getPointAt(t));
    if (d < bestDist) {
      bestDist = d;
      bestT = t;
    }
  }
  return bestT;
}

/** Get the nearest point on the curve and push direction */
export function getTrackPush(
  pos: THREE.Vector3,
  curve: THREE.CatmullRomCurve3
): { distance: number; pushX: number; pushZ: number; t: number } {
  let bestDist = Infinity;
  let bestT = 0;
  for (let i = 0; i < 600; i++) {
    const t = i / 600;
    const d = pos.distanceTo(curve.getPointAt(t));
    if (d < bestDist) {
      bestDist = d;
      bestT = t;
    }
  }
  const nearest = curve.getPointAt(bestT);
  const dx = nearest.x - pos.x;
  const dz = nearest.z - pos.z;
  const len = Math.sqrt(dx * dx + dz * dz) || 1;
  return { distance: bestDist, pushX: dx / len, pushZ: dz / len, t: bestT };
}

export interface CarState {
  x: number;
  z: number;
  angle: number;
  speed: number;
  trackT: number;
  prevTrackT: number;
  lap: number;
  passedHalfway: boolean;
  lapStartTime: number;
  bestLapTime: number;
  totalDistance: number;
}

export function createCarState(x: number, z: number, angle: number): CarState {
  return {
    x, z, angle,
    speed: 0,
    trackT: 0,
    prevTrackT: 0,
    lap: 0,
    passedHalfway: false,
    lapStartTime: 0,
    bestLapTime: Infinity,
    totalDistance: 0,
  };
}
