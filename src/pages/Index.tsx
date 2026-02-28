import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import GameWorld from '@/components/game/GameWorld';
import GameHUD from '@/components/game/GameHUD';
import { audioEngine } from '@/components/game/audioEngine';
import { CAR_COLORS, CAR_NAMES, TOTAL_LAPS } from '@/components/game/trackData';
import type { HUDData } from '@/components/game/GameWorld';

interface LeaderboardEntry {
  time: number;
  date: string;
  position: number;
}

function loadLeaderboard(): LeaderboardEntry[] {
  try { return JSON.parse(localStorage.getItem('mx-leaderboard') || '[]'); }
  catch { return []; }
}

function saveToLeaderboard(time: number, position: number): LeaderboardEntry[] {
  const entries = loadLeaderboard();
  entries.push({ time, date: new Date().toISOString(), position });
  entries.sort((a, b) => a.time - b.time);
  const top = entries.slice(0, 10);
  localStorage.setItem('mx-leaderboard', JSON.stringify(top));
  return top;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

function ordinal(n: number): string {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

const defaultHUD: HUDData = {
  time: 0, lap: 0, totalLaps: TOTAL_LAPS, speed: 0,
  position: 8, totalCars: 8, raceFinished: false,
  bestLapTime: null, finishPosition: 8, countdown: 3,
};

type Screen = 'menu' | 'playing' | 'results';

const Index = () => {
  const [screen, setScreen] = useState<Screen>('menu');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isNight, setIsNight] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hudData, setHudData] = useState<HUDData>(defaultHUD);
  const [raceTime, setRaceTime] = useState(0);
  const [racePosition, setRacePosition] = useState(1);
  const [leaderboard, setLeaderboard] = useState(loadLeaderboard);
  const [showTrophy, setShowTrophy] = useState(false);
  const gameKey = useRef(0);

  const selectedColor = CAR_COLORS[selectedIndex];
  const aiColors = useMemo(() =>
    CAR_COLORS.filter((_, i) => i !== selectedIndex).slice(0, 7),
    [selectedIndex]
  );

  const prevCar = useCallback(() => {
    audioEngine.init(); audioEngine.playClick();
    setSelectedIndex(i => (i - 1 + CAR_COLORS.length) % CAR_COLORS.length);
  }, []);

  const nextCar = useCallback(() => {
    audioEngine.init(); audioEngine.playClick();
    setSelectedIndex(i => (i + 1) % CAR_COLORS.length);
  }, []);

  const startRace = useCallback(() => {
    audioEngine.init();
    gameKey.current++;
    setHudData(defaultHUD);
    setIsPaused(false);
    setShowTrophy(false);
    setScreen('playing');
  }, []);

  const handleRaceFinish = useCallback((time: number, position: number) => {
    setRaceTime(time);
    setRacePosition(position);
    setLeaderboard(saveToLeaderboard(time, position));
    if (position <= 3) setShowTrophy(true);
    setTimeout(() => setScreen('results'), 800);
  }, []);

  const handleRestart = useCallback(() => {
    audioEngine.stop();
    startRace();
  }, [startRace]);

  const goToMenu = useCallback(() => {
    audioEngine.stop();
    setScreen('menu');
  }, []);

  useEffect(() => {
    if (screen !== 'playing') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') setIsPaused(prev => !prev);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen]);

  // --- Menu Screen ---
  if (screen === 'menu') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
        {/* Background racing stripe texture */}
        <div className="absolute inset-0 racing-stripe opacity-30" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, hsla(0, 84%, 50%, 0.06) 0%, transparent 70%)' }} />

        <div className="w-full max-w-lg px-6 relative z-10">
          {/* Logo */}
          <div className="text-center mb-10">
            <h1 className="font-racing text-6xl font-black tracking-tight text-foreground mb-1">
              MOMENTUM<span className="text-primary text-glow">X</span>
            </h1>
            <div className="w-32 h-0.5 mx-auto mt-3 mb-3" style={{ background: 'linear-gradient(90deg, transparent, hsl(0, 84%, 50%), transparent)' }} />
            <p className="font-hud text-muted-foreground text-sm tracking-wider">{TOTAL_LAPS}-Lap Circuit Race — 8 Drivers</p>
          </div>

          {/* Car selector */}
          <div className="mb-8">
            <p className="font-hud text-xs text-muted-foreground mb-4 text-center uppercase tracking-[0.25em] font-semibold">Select Your Car</p>
            <div className="flex items-center justify-center gap-6">
              <button onClick={prevCar} className="w-10 h-10 rounded-full hud-panel flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-90 text-lg font-bold">
                ‹
              </button>
              <div className="flex flex-col items-center">
                <div
                  className="w-32 h-20 rounded-xl flex items-center justify-center mb-3 transition-all duration-300"
                  style={{
                    backgroundColor: selectedColor,
                    boxShadow: `0 8px 40px ${selectedColor}50, 0 0 80px ${selectedColor}20`,
                    border: `1px solid ${selectedColor}60`,
                  }}
                >
                  <svg width="90" height="36" viewBox="0 0 90 36" fill="none">
                    <rect x="5" y="20" width="80" height="12" rx="4" fill="rgba(0,0,0,0.35)" />
                    <rect x="18" y="8" width="44" height="14" rx="3" fill="rgba(0,0,0,0.2)" />
                    <circle cx="22" cy="32" r="5" fill="rgba(0,0,0,0.45)" />
                    <circle cx="22" cy="32" r="2.5" fill="rgba(255,255,255,0.15)" />
                    <circle cx="68" cy="32" r="5" fill="rgba(0,0,0,0.45)" />
                    <circle cx="68" cy="32" r="2.5" fill="rgba(255,255,255,0.15)" />
                    <rect x="70" y="22" width="12" height="3" rx="1" fill="rgba(255,255,255,0.3)" />
                    <rect x="8" y="22" width="8" height="2" rx="1" fill="rgba(255,0,0,0.5)" />
                  </svg>
                </div>
                <span className="font-racing text-sm font-bold text-foreground tracking-wider">{CAR_NAMES[selectedIndex]}</span>
                <span className="font-hud text-xs text-muted-foreground mt-0.5">{selectedIndex + 1} / {CAR_COLORS.length}</span>
              </div>
              <button onClick={nextCar} className="w-10 h-10 rounded-full hud-panel flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-90 text-lg font-bold">
                ›
              </button>
            </div>
          </div>

          {/* Day/Night toggle */}
          <div className="flex justify-center mb-8">
            <div className="hud-panel flex rounded-lg overflow-hidden">
              <button
                onClick={() => setIsNight(false)}
                className={`px-6 py-2.5 font-hud text-sm font-semibold transition-all cursor-pointer ${!isNight ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Day
              </button>
              <button
                onClick={() => setIsNight(true)}
                className={`px-6 py-2.5 font-hud text-sm font-semibold transition-all cursor-pointer ${isNight ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Night
              </button>
            </div>
          </div>

          {/* Start button */}
          <div className="text-center mb-10">
            <button
              onClick={startRace}
              className="px-14 py-3.5 bg-primary text-primary-foreground font-racing font-bold text-lg tracking-[0.15em] rounded-lg hover:opacity-90 transition-all cursor-pointer active:scale-95 glow-red"
            >
              START RACE
            </button>
          </div>

          {/* Controls card */}
          <div className="hud-panel p-5 mb-4">
            <p className="font-racing text-xs text-muted-foreground mb-3 uppercase tracking-[0.2em]">Controls</p>
            <div className="grid grid-cols-2 gap-y-2 text-sm font-hud">
              <span className="text-muted-foreground">Accelerate</span>
              <span className="text-foreground font-semibold text-right">W / ↑</span>
              <span className="text-muted-foreground">Brake / Reverse</span>
              <span className="text-foreground font-semibold text-right">S / ↓</span>
              <span className="text-muted-foreground">Steer Left</span>
              <span className="text-foreground font-semibold text-right">A / ←</span>
              <span className="text-muted-foreground">Steer Right</span>
              <span className="text-foreground font-semibold text-right">D / →</span>
              <span className="text-muted-foreground">Pause</span>
              <span className="text-foreground font-semibold text-right">Esc</span>
            </div>
          </div>

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <div className="hud-panel p-5">
              <p className="font-racing text-xs text-muted-foreground mb-3 uppercase tracking-[0.2em]">Best Times</p>
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((entry, i) => (
                  <div key={i} className={`flex justify-between text-sm font-hud items-center px-2 py-1 rounded ${i === 0 ? 'bg-accent/10' : ''}`}>
                    <span className={`font-semibold w-6 ${i === 0 ? 'text-accent' : 'text-muted-foreground'}`}>#{i + 1}</span>
                    <span className={`font-racing tracking-wider ${i === 0 ? 'text-accent' : 'text-foreground'}`}>{formatTime(entry.time)}</span>
                    <span className="text-muted-foreground">{ordinal(entry.position)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Results Screen ---
  if (screen === 'results') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute inset-0 racing-stripe opacity-20" />
        <div className="absolute inset-0" style={{
          background: racePosition <= 3
            ? 'radial-gradient(ellipse at center, hsla(45, 100%, 50%, 0.06) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at center, hsla(220, 15%, 15%, 0.3) 0%, transparent 70%)',
        }} />

        <div className="w-full max-w-md px-6 text-center relative z-10">
          <h2 className="font-racing text-2xl font-bold text-muted-foreground mb-1 tracking-wider">
            MOMENTUM<span className="text-primary">X</span>
          </h2>
          <h3 className="font-racing text-4xl font-black text-foreground mb-4 tracking-wider">RACE COMPLETE</h3>

          {/* Trophy for top 3 */}
          {showTrophy && (
            <div className="my-6">
              <div className="inline-block" style={{ animation: 'bounce 1.5s ease-in-out infinite' }}>
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <path d="M20 15h40v5c0 12-8 22-20 25-12-3-20-13-20-25v-5z" fill="hsl(45, 100%, 50%)" />
                  <rect x="10" y="10" width="10" height="20" rx="3" fill="hsl(45, 100%, 50%)" opacity="0.7" />
                  <rect x="60" y="10" width="10" height="20" rx="3" fill="hsl(45, 100%, 50%)" opacity="0.7" />
                  <rect x="32" y="45" width="16" height="10" fill="hsl(45, 100%, 50%)" />
                  <rect x="25" y="55" width="30" height="8" rx="2" fill="hsl(45, 100%, 50%)" opacity="0.8" />
                </svg>
              </div>
            </div>
          )}

          <p className="font-racing text-7xl font-black text-primary text-glow mb-8">{ordinal(racePosition)}</p>

          <div className="hud-panel p-5 mb-4 text-left">
            <div className="flex justify-between mb-3 items-center">
              <span className="font-hud text-muted-foreground text-sm">Total Time</span>
              <span className="font-racing font-bold text-foreground text-lg tracking-wider">{formatTime(raceTime)}</span>
            </div>
            {hudData.bestLapTime !== null && (
              <div className="flex justify-between items-center">
                <span className="font-hud text-muted-foreground text-sm">Best Lap</span>
                <span className="font-racing font-bold text-accent text-lg tracking-wider">{formatTime(hudData.bestLapTime)}</span>
              </div>
            )}
          </div>

          {leaderboard.length > 0 && (
            <div className="hud-panel p-5 mb-8 text-left">
              <p className="font-racing text-xs text-muted-foreground mb-3 uppercase tracking-[0.2em]">Leaderboard</p>
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((entry, i) => (
                  <div key={i} className={`flex justify-between text-sm font-hud items-center px-2 py-1 rounded ${i === 0 ? 'bg-accent/10' : ''}`}>
                    <span className={`font-semibold w-6 ${i === 0 ? 'text-accent' : 'text-muted-foreground'}`}>#{i + 1}</span>
                    <span className={`font-racing tracking-wider ${i === 0 ? 'text-accent' : 'text-foreground'}`}>{formatTime(entry.time)}</span>
                    <span className="text-muted-foreground">{ordinal(entry.position)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <button onClick={handleRestart} className="px-10 py-3 bg-primary text-primary-foreground font-racing font-bold text-sm tracking-[0.15em] rounded-lg hover:opacity-90 transition-all cursor-pointer active:scale-95 glow-red">
              RACE AGAIN
            </button>
            <button onClick={goToMenu} className="px-10 py-3 bg-secondary text-secondary-foreground font-racing font-bold text-sm tracking-[0.15em] rounded-lg hover:opacity-90 transition-all cursor-pointer active:scale-95">
              MENU
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Game Screen ---
  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      <Canvas
        key={gameKey.current}
        camera={{ fov: 60, near: 0.1, far: 600 }}
        shadows
        style={{ position: 'absolute', inset: 0 }}
      >
        <GameWorld
          playerColor={selectedColor}
          aiColors={aiColors}
          isPaused={isPaused}
          isNight={isNight}
          onHUDUpdate={setHudData}
          onRaceFinish={handleRaceFinish}
        />
      </Canvas>
      <GameHUD
        data={hudData}
        isPaused={isPaused}
        onPause={() => setIsPaused(true)}
        onResume={() => setIsPaused(false)}
        onRestart={handleRestart}
        playerColor={selectedColor}
        aiColors={aiColors}
      />
    </div>
  );
};

export default Index;
