import { useMemo } from 'react';
import * as THREE from 'three';
import { createTrackCurve, createRoadGeometry, ROAD_WIDTH } from './trackData';

/** Renders the 3D race track with road, barriers, environment */
export default function RaceTrack({ isNight = false }: { isNight?: boolean }) {
  const { roadGeo, barriers, startLine, laneLines, trees, curbStones, buildings } = useMemo(() => {
    const curve = createTrackCurve();
    const roadGeo = createRoadGeometry(curve);

    // Barriers
    const barriers: { x: number; z: number; ry: number; isRed: boolean }[] = [];
    const count = 240;
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const p = curve.getPointAt(t);
      const tang = curve.getTangentAt(t);
      const normal = new THREE.Vector3(-tang.z, 0, tang.x).normalize();
      const angle = Math.atan2(tang.x, tang.z);
      const offset = ROAD_WIDTH / 2 + 1;
      const left = p.clone().add(normal.clone().multiplyScalar(offset));
      const right = p.clone().add(normal.clone().multiplyScalar(-offset));
      barriers.push({ x: left.x, z: left.z, ry: angle, isRed: i % 4 < 2 });
      barriers.push({ x: right.x, z: right.z, ry: angle, isRed: i % 4 < 2 });
    }

    // Lane dashes
    const laneLines: { x: number; z: number; ry: number }[] = [];
    const lineCount = 200;
    for (let i = 0; i < lineCount; i++) {
      const t = i / lineCount;
      const p = curve.getPointAt(t);
      const tang = curve.getTangentAt(t);
      const angle = Math.atan2(tang.x, tang.z);
      laneLines.push({ x: p.x, z: p.z, ry: angle });
    }

    // Curb stones
    const curbStones: { x: number; z: number; ry: number; isRed: boolean }[] = [];
    const curbCount = 400;
    for (let i = 0; i < curbCount; i++) {
      const t = i / curbCount;
      const p = curve.getPointAt(t);
      const tang = curve.getTangentAt(t);
      const normal = new THREE.Vector3(-tang.z, 0, tang.x).normalize();
      const angle = Math.atan2(tang.x, tang.z);
      const offset = ROAD_WIDTH / 2 - 0.3;
      const left = p.clone().add(normal.clone().multiplyScalar(offset));
      const right = p.clone().add(normal.clone().multiplyScalar(-offset));
      curbStones.push({ x: left.x, z: left.z, ry: angle, isRed: i % 2 === 0 });
      curbStones.push({ x: right.x, z: right.z, ry: angle, isRed: i % 2 === 0 });
    }

    // Trees
    const trees: { x: number; z: number; scale: number }[] = [];
    const rng = (seed: number) => ((Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1;
    for (let i = 0; i < 100; i++) {
      const t = i / 100;
      const p = curve.getPointAt(t);
      const tang = curve.getTangentAt(t);
      const normal = new THREE.Vector3(-tang.z, 0, tang.x).normalize();
      const side = i % 2 === 0 ? 1 : -1;
      const dist = ROAD_WIDTH / 2 + 8 + rng(i) * 25;
      trees.push({
        x: p.x + normal.x * side * dist,
        z: p.z + normal.z * side * dist,
        scale: 0.8 + rng(i + 50) * 0.8,
      });
    }

    // Buildings along track
    const buildings: { x: number; z: number; w: number; h: number; d: number; color: string }[] = [];
    const buildingColors = ['#5a5a6e', '#4a4a5e', '#6a6a7e', '#3a3a4e', '#7a7a8e'];
    for (let i = 0; i < 40; i++) {
      const t = ((i * 7 + 3) % 100) / 100;
      const p = curve.getPointAt(t);
      const tang = curve.getTangentAt(t);
      const normal = new THREE.Vector3(-tang.z, 0, tang.x).normalize();
      const side = i % 2 === 0 ? 1 : -1;
      const dist = ROAD_WIDTH / 2 + 20 + rng(i + 200) * 30;
      const w = 4 + rng(i + 300) * 8;
      const h = 5 + rng(i + 400) * 15;
      const d = 4 + rng(i + 500) * 8;
      buildings.push({
        x: p.x + normal.x * side * dist,
        z: p.z + normal.z * side * dist,
        w, h, d,
        color: buildingColors[i % buildingColors.length],
      });
    }

    // Start line
    const sp = curve.getPointAt(0);
    const st = curve.getTangentAt(0);
    const startAngle = Math.atan2(st.x, st.z);

    return { roadGeo, barriers, startLine: { x: sp.x, z: sp.z, ry: startAngle }, laneLines, trees, curbStones, buildings };
  }, []);

  const groundColor = isNight ? '#0a1a0a' : '#2a6b1a';
  const barrierWhite = isNight ? '#999999' : '#eeeeee';

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[800, 600]} />
        <meshStandardMaterial color={groundColor} />
      </mesh>

      {/* Road */}
      <mesh geometry={roadGeo} receiveShadow>
        <meshStandardMaterial color="#1a1a1a" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Lane dashes */}
      {laneLines.map((ll, i) => (
        i % 2 === 0 ? (
          <mesh key={`ll-${i}`} position={[ll.x, 0.02, ll.z]} rotation={[-Math.PI / 2, 0, ll.ry]}>
            <planeGeometry args={[0.15, 2.5]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.4} />
          </mesh>
        ) : null
      ))}

      {/* Curb stones */}
      {curbStones.map((cs, i) => (
        <mesh key={`cs-${i}`} position={[cs.x, 0.015, cs.z]} rotation={[-Math.PI / 2, 0, cs.ry]}>
          <planeGeometry args={[0.5, 0.8]} />
          <meshStandardMaterial color={cs.isRed ? '#cc0000' : '#ffffff'} />
        </mesh>
      ))}

      {/* Start/finish line */}
      <mesh position={[startLine.x, 0.025, startLine.z]} rotation={[-Math.PI / 2, 0, startLine.ry]}>
        <planeGeometry args={[ROAD_WIDTH, 3]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[startLine.x, 0.026, startLine.z]} rotation={[-Math.PI / 2, 0, startLine.ry]}>
        <planeGeometry args={[ROAD_WIDTH / 2, 1.5]} />
        <meshStandardMaterial color="#111111" />
      </mesh>

      {/* Barriers */}
      {barriers.map((b, i) => (
        <mesh key={`b-${i}`} position={[b.x, 0.4, b.z]} rotation={[0, b.ry, 0]} castShadow>
          <boxGeometry args={[0.3, 0.8, 2.0]} />
          <meshStandardMaterial color={b.isRed ? '#cc0000' : barrierWhite} />
        </mesh>
      ))}

      {/* Trees */}
      {trees.map((tree, i) => (
        <group key={`tree-${i}`} position={[tree.x, 0, tree.z]} scale={[tree.scale, tree.scale, tree.scale]}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.4, 3, 6]} />
            <meshStandardMaterial color="#5c3a1e" roughness={0.9} />
          </mesh>
          <mesh position={[0, 4, 0]} castShadow>
            <coneGeometry args={[2.2, 4, 6]} />
            <meshStandardMaterial color={isNight ? '#0e3e0e' : '#1a5c1a'} roughness={0.8} />
          </mesh>
          <mesh position={[0, 5.5, 0]} castShadow>
            <coneGeometry args={[1.5, 3, 6]} />
            <meshStandardMaterial color={isNight ? '#125012' : '#1e6b1e'} roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Buildings */}
      {buildings.map((b, i) => (
        <group key={`bld-${i}`} position={[b.x, b.h / 2, b.z]}>
          <mesh castShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color={b.color} roughness={0.8} />
          </mesh>
          {/* Windows (emissive at night) */}
          {isNight && Array.from({ length: Math.floor(b.h / 3) }).map((_, wi) => (
            <mesh key={wi} position={[b.w / 2 + 0.01, -b.h / 2 + 2 + wi * 3, 0]}>
              <planeGeometry args={[0.01, 1.2]} />
              <meshStandardMaterial color="#ffdd88" emissive="#ffdd88" emissiveIntensity={0.6} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
