import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import CarModel from './CarModel';
import RaceTrack from './RaceTrack';
import { audioEngine } from './audioEngine';
import {
  createTrackCurve, createCarState, getTrackPush, getTrackT,
  ROAD_WIDTH, MAX_SPEED, ACCEL, BRAKE_FORCE, TURN_RATE,
  TOTAL_LAPS, AI_TARGET_SPEEDS, CarState
} from './trackData';

export interface HUDData {
  time: number;
  lap: number;
  totalLaps: number;
  speed: number;
  position: number;
  totalCars: number;
  raceFinished: boolean;
  bestLapTime: number | null;
  finishPosition: number;
  countdown: number;
}

interface GameWorldProps {
  playerColor: string;
  aiColors: string[];
  isPaused: boolean;
  isNight: boolean;
  onHUDUpdate: (data: HUDData) => void;
  onRaceFinish: (time: number, position: number) => void;
}

const TOTAL_CARS = 8;
const COUNTDOWN_DURATION = 3;

export default function GameWorld({ playerColor, aiColors, isPaused, isNight, onHUDUpdate, onRaceFinish }: GameWorldProps) {
  const curve = useMemo(() => createTrackCurve(), []);
  const { camera } = useThree();

  const playerRef = useRef<THREE.Group>(null);
  const aiRefs = useRef<(THREE.Group | null)[]>(Array(7).fill(null));

  const keys = useRef({ forward: false, backward: false, left: false, right: false });

  const state = useRef<{
    player: CarState;
    ai: CarState[];
    time: number;
    countdown: number;
    raceStarted: boolean;
    raceFinished: boolean;
    finishPosition: number;
    lastHUDTime: number;
    crashCooldown: number;
  } | null>(null);

  if (!state.current) {
    const startPoint = curve.getPointAt(0);
    const startTangent = curve.getTangentAt(0);
    const startAngle = Math.atan2(startTangent.x, startTangent.z);
    const startNormal = new THREE.Vector3(-startTangent.z, 0, startTangent.x).normalize();

    const player = createCarState(startPoint.x, startPoint.z, startAngle);
    player.trackT = 0;
    player.prevTrackT = 0;

    const aiCount = aiColors.length;
    const ai: CarState[] = [];
    for (let i = 0; i < aiCount; i++) {
      const row = Math.floor((i + 1) / 2);
      const lateral = ((i + 1) % 2 === 0 ? 1 : -1) * (3 + (row % 2) * 1.5);
      const behindT = (1 - (row + 1) * 0.006 + 1) % 1;
      const bp = curve.getPointAt(behindT);
      const bt = curve.getTangentAt(behindT);
      const bn = new THREE.Vector3(-bt.z, 0, bt.x).normalize();
      const car = createCarState(bp.x + bn.x * lateral, bp.z + bn.z * lateral, Math.atan2(bt.x, bt.z));
      car.trackT = behindT;
      car.prevTrackT = behindT;
      ai.push(car);
    }

    state.current = {
      player, ai, time: 0, countdown: COUNTDOWN_DURATION,
      raceStarted: false, raceFinished: false, finishPosition: TOTAL_CARS,
      lastHUDTime: -1, crashCooldown: 0,
    };

    camera.position.set(
      player.x - Math.sin(player.angle) * 18,
      10,
      player.z - Math.cos(player.angle) * 18
    );
    camera.lookAt(player.x, 1, player.z);
  }

  useEffect(() => {
    const setKey = (code: string, val: boolean) => {
      const k = keys.current;
      if (code === 'ArrowUp' || code === 'KeyW') k.forward = val;
      if (code === 'ArrowDown' || code === 'KeyS') k.backward = val;
      if (code === 'ArrowLeft' || code === 'KeyA') k.left = val;
      if (code === 'ArrowRight' || code === 'KeyD') k.right = val;
    };
    const onDown = (e: KeyboardEvent) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].includes(e.code)) {
        e.preventDefault();
        setKey(e.code, true);
      }
    };
    const onUp = (e: KeyboardEvent) => setKey(e.code, false);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  const checkLap = useCallback((car: CarState, time: number, isPlayer: boolean) => {
    const prevT = car.prevTrackT;
    const currT = car.trackT;
    if (prevT < 0.5 && currT >= 0.5) car.passedHalfway = true;
    if (prevT > 0.85 && currT < 0.15 && car.passedHalfway) {
      car.lap++;
      car.passedHalfway = false;
      const lapTime = time - car.lapStartTime;
      if (lapTime < car.bestLapTime && car.lap > 0) car.bestLapTime = lapTime;
      car.lapStartTime = time;
      if (isPlayer) audioEngine.playLapSound();
    }
  }, []);

  const getPosition = useCallback((p: CarState, ais: CarState[]): number => {
    const all = [
      { lap: p.lap, t: p.trackT, idx: 0 },
      ...ais.map((a, i) => ({ lap: a.lap, t: a.trackT, idx: i + 1 }))
    ];
    all.sort((a, b) => b.lap - a.lap || b.t - a.t);
    return all.findIndex(c => c.idx === 0) + 1;
  }, []);

  useFrame((_, rawDelta) => {
    const s = state.current!;
    if (isPaused || s.raceFinished) return;

    const dt = Math.min(rawDelta, 0.05);

    // Countdown phase
    if (!s.raceStarted) {
      s.countdown -= dt;
      if (s.countdown <= 0) {
        s.raceStarted = true;
        s.countdown = 0;
      }
      // Update HUD with countdown
      onHUDUpdate({
        time: 0, lap: 0, totalLaps: TOTAL_LAPS, speed: 0,
        position: TOTAL_CARS, totalCars: TOTAL_CARS,
        raceFinished: false, bestLapTime: null, finishPosition: TOTAL_CARS,
        countdown: Math.ceil(s.countdown),
      });
      // Still update camera during countdown
      const p = s.player;
      const camDist = 18;
      const camHeight = 10;
      const camTarget = new THREE.Vector3(
        p.x - Math.sin(p.angle) * camDist, camHeight,
        p.z - Math.cos(p.angle) * camDist
      );
      camera.position.lerp(camTarget, 1 - Math.exp(-3.5 * dt));
      camera.lookAt(p.x, 1.5, p.z);
      return;
    }

    s.time += dt;
    s.crashCooldown = Math.max(0, s.crashCooldown - dt);

    const p = s.player;
    const k = keys.current;

    // Player physics
    if (k.forward) p.speed += ACCEL * dt;
    if (k.backward) p.speed -= BRAKE_FORCE * dt;
    if (!k.forward && !k.backward) p.speed *= Math.pow(0.97, dt * 60);
    p.speed = Math.max(-MAX_SPEED * 0.3, Math.min(MAX_SPEED, p.speed));
    if (Math.abs(p.speed) < 0.1) p.speed = 0;

    if (Math.abs(p.speed) > 0.3) {
      const turnDir = (k.left ? 1 : 0) + (k.right ? -1 : 0);
      const speedFactor = Math.min(1, Math.abs(p.speed) / 20);
      p.angle += turnDir * TURN_RATE * speedFactor * dt;
    }

    p.x += Math.sin(p.angle) * p.speed * dt;
    p.z += Math.cos(p.angle) * p.speed * dt;

    const pPos = new THREE.Vector3(p.x, 0, p.z);
    const pPush = getTrackPush(pPos, curve);
    if (pPush.distance > ROAD_WIDTH / 2 - 1) {
      const overshoot = pPush.distance - (ROAD_WIDTH / 2 - 1);
      p.x += pPush.pushX * overshoot * 0.8;
      p.z += pPush.pushZ * overshoot * 0.8;
      p.speed *= 0.88;
      if (s.crashCooldown <= 0 && Math.abs(p.speed) > 5) {
        audioEngine.playCrashSound();
        s.crashCooldown = 0.5;
      }
    }

    p.prevTrackT = p.trackT;
    p.trackT = getTrackT(pPos, curve);
    checkLap(p, s.time, true);

    // AI physics
    s.ai.forEach((ai, idx) => {
      const baseSpeed = AI_TARGET_SPEEDS[idx % AI_TARGET_SPEEDS.length];
      const targetSpeed = baseSpeed + Math.sin(s.time * 0.5 + idx * 2) * 3;
      const lookAheadT = (getTrackT(new THREE.Vector3(ai.x, 0, ai.z), curve) + 0.025) % 1;
      const targetPt = curve.getPointAt(lookAheadT);

      const dx = targetPt.x - ai.x;
      const dz = targetPt.z - ai.z;
      const targetAngle = Math.atan2(dx, dz);

      let angleDiff = targetAngle - ai.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      ai.angle += angleDiff * 5 * dt;
      ai.speed += (targetSpeed - ai.speed) * 3 * dt;

      ai.x += Math.sin(ai.angle) * ai.speed * dt;
      ai.z += Math.cos(ai.angle) * ai.speed * dt;

      const aiPos = new THREE.Vector3(ai.x, 0, ai.z);
      const aiPush = getTrackPush(aiPos, curve);
      if (aiPush.distance > ROAD_WIDTH / 2 - 2) {
        const overshoot = aiPush.distance - (ROAD_WIDTH / 2 - 2);
        ai.x += aiPush.pushX * overshoot;
        ai.z += aiPush.pushZ * overshoot;
        ai.speed *= 0.95;
      }

      ai.prevTrackT = ai.trackT;
      ai.trackT = getTrackT(aiPos, curve);
      checkLap(ai, s.time, false);
    });

    // Car-to-car collision
    const allCars = [p, ...s.ai];
    for (let i = 0; i < allCars.length; i++) {
      for (let j = i + 1; j < allCars.length; j++) {
        const cdx = allCars[j].x - allCars[i].x;
        const cdz = allCars[j].z - allCars[i].z;
        const dist = Math.sqrt(cdx * cdx + cdz * cdz);
        if (dist < 3.5 && dist > 0.01) {
          const push = (3.5 - dist) * 0.5;
          const nx = cdx / dist;
          const nz = cdz / dist;
          allCars[i].x -= nx * push * dt * 10;
          allCars[i].z -= nz * push * dt * 10;
          allCars[j].x += nx * push * dt * 10;
          allCars[j].z += nz * push * dt * 10;
          allCars[i].speed *= 0.96;
          allCars[j].speed *= 0.96;
        }
      }
    }

    // Update mesh positions
    if (playerRef.current) {
      playerRef.current.position.set(p.x, 0, p.z);
      playerRef.current.rotation.y = p.angle;
    }
    s.ai.forEach((ai, i) => {
      const ref = aiRefs.current[i];
      if (ref) {
        ref.position.set(ai.x, 0, ai.z);
        ref.rotation.y = ai.angle;
      }
    });

    // Camera
    const camDist = 18;
    const camHeight = 9;
    const camTarget = new THREE.Vector3(
      p.x - Math.sin(p.angle) * camDist, camHeight,
      p.z - Math.cos(p.angle) * camDist
    );
    camera.position.lerp(camTarget, 1 - Math.exp(-3.5 * dt));
    camera.lookAt(p.x, 1.5, p.z);

    audioEngine.updateEngine(p.speed);

    if (s.time - s.lastHUDTime > 0.05) {
      s.lastHUDTime = s.time;
      const pos = getPosition(p, s.ai);
      onHUDUpdate({
        time: s.time,
        lap: Math.min(p.lap, TOTAL_LAPS),
        totalLaps: TOTAL_LAPS,
        speed: Math.abs(p.speed),
        position: pos,
        totalCars: TOTAL_CARS,
        raceFinished: false,
        bestLapTime: p.bestLapTime < Infinity ? p.bestLapTime : null,
        finishPosition: pos,
        countdown: 0,
      });
    }

    if (p.lap >= TOTAL_LAPS) {
      s.raceFinished = true;
      const finalPos = getPosition(p, s.ai);
      s.finishPosition = finalPos;
      audioEngine.playFinishSound();
      onRaceFinish(s.time, finalPos);
    }
  });

  const setAiRef = (idx: number) => (el: THREE.Group | null) => { aiRefs.current[idx] = el; };

  return (
    <>
      <ambientLight intensity={isNight ? 0.15 : 0.4} />
      <directionalLight
        position={isNight ? [40, 60, 20] : [80, 80, 40]}
        intensity={isNight ? 0.3 : 1.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-180}
        shadow-camera-right={180}
        shadow-camera-top={180}
        shadow-camera-bottom={-180}
      />
      {isNight ? (
        <hemisphereLight args={['#0a0a2a', '#0a1a0a', 0.15]} />
      ) : (
        <>
          <hemisphereLight args={['#87ceeb', '#2a6b1a', 0.3]} />
          <Sky sunPosition={[100, 60, 80]} turbidity={2} rayleigh={0.5} />
        </>
      )}
      {isNight && <fog attach="fog" args={['#050510', 80, 350]} />}

      <RaceTrack isNight={isNight} />

      <CarModel ref={playerRef} color={playerColor} />
      {aiColors.map((color, i) => (
        <CarModel key={i} ref={setAiRef(i)} color={color} />
      ))}
    </>
  );
}
