import type { HUDData } from './GameWorld';

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

interface GameHUDProps {
  data: HUDData;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  playerColor: string;
  aiColors: string[];
}

export default function GameHUD({ data, isPaused, onPause, onResume, onRestart, playerColor, aiColors }: GameHUDProps) {
  const allColors = [playerColor, ...aiColors];
  const speedKmh = Math.round(data.speed * 5);
  const speedPercent = Math.min(100, (data.speed / 65) * 100);

  // Countdown overlay
  if (data.countdown > 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <div className="text-center">
          <div
            className="font-racing text-[10rem] font-black text-primary text-glow leading-none"
            style={{ animation: 'pulse 0.8s ease-in-out infinite' }}
          >
            {data.countdown}
          </div>
          <div className="font-racing text-xl text-muted-foreground mt-6 tracking-[0.5em] uppercase">
            Get Ready
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* Top HUD strip */}
      <div className="flex items-start justify-between p-3 gap-3">
        {/* Timer */}
        <div className="hud-panel px-4 py-2.5 min-w-[120px]">
          <div className="font-hud text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Race Time</div>
          <div className="font-racing text-2xl font-bold text-foreground tracking-wider">{formatTime(data.time)}</div>
        </div>

        {/* Position badge - prominent center */}
        <div className="hud-panel px-6 py-2.5 text-center glow-red relative overflow-hidden">
          <div className="racing-stripe absolute inset-0" />
          <div className="relative">
            <div className="font-hud text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Position</div>
            <div className="font-racing text-4xl font-black text-primary text-glow leading-tight">{ordinal(data.position)}</div>
            <div className="font-hud text-xs text-muted-foreground font-medium">of {data.totalCars}</div>
          </div>
        </div>

        {/* Lap counter */}
        <div className="hud-panel px-4 py-2.5 text-right min-w-[120px]">
          <div className="font-hud text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Lap</div>
          <div className="font-racing text-2xl font-bold text-foreground tracking-wider">
            {Math.min(data.lap + 1, data.totalLaps)}<span className="text-muted-foreground text-lg">/{data.totalLaps}</span>
          </div>
          {/* Lap progress bar */}
          <div className="w-24 h-1 bg-muted rounded-full mt-1.5 overflow-hidden ml-auto">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${((data.lap) / data.totalLaps) * 100}%`,
                background: 'linear-gradient(90deg, hsl(0, 84%, 50%), hsl(45, 100%, 50%))',
              }}
            />
          </div>
        </div>
      </div>

      {/* Race standings - right side */}
      <div className="absolute top-[88px] right-3">
        <div className="hud-panel px-3 py-2.5">
          <div className="font-hud text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold mb-2">Standings</div>
          <div className="flex flex-col gap-1.5">
            {allColors.map((color, i) => (
              <div key={i} className={`flex items-center gap-2 px-1.5 py-0.5 rounded ${i === 0 ? 'bg-primary/10' : ''}`}>
                <div className="font-hud text-[10px] text-muted-foreground w-4 font-semibold">{i + 1}.</div>
                <div
                  className="w-5 h-2.5 rounded-sm"
                  style={{
                    backgroundColor: color,
                    boxShadow: i === 0 ? `0 0 8px ${color}80` : 'none',
                  }}
                />
                <span className={`font-hud text-xs font-semibold ${i === 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {i === 0 ? 'YOU' : `CPU ${i}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom HUD bar */}
      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
        {/* Speedometer */}
        <div className="hud-panel px-5 py-3 min-w-[180px]">
          <div className="font-hud text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Speed</div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-racing text-4xl font-black text-foreground leading-none tracking-wider">{speedKmh}</span>
            <span className="font-hud text-xs text-muted-foreground font-semibold">KM/H</span>
          </div>
          {/* Speed bar */}
          <div className="w-36 h-2 bg-muted rounded-full mt-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-75 ease-linear"
              style={{
                width: `${speedPercent}%`,
                background: speedPercent > 80
                  ? 'linear-gradient(90deg, hsl(45, 100%, 50%), hsl(0, 84%, 50%))'
                  : speedPercent > 50
                    ? 'linear-gradient(90deg, hsl(120, 60%, 40%), hsl(45, 100%, 50%))'
                    : 'hsl(120, 60%, 40%)',
              }}
            />
          </div>
        </div>

        {/* Best lap - center */}
        {data.bestLapTime !== null && (
          <div className="hud-panel px-4 py-2.5 glow-accent">
            <div className="font-hud text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Best Lap</div>
            <div className="font-racing text-xl font-bold text-accent tracking-wider">{formatTime(data.bestLapTime)}</div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2 pointer-events-auto">
          <button
            onClick={isPaused ? onResume : onPause}
            className="hud-panel px-4 py-2.5 font-hud text-sm font-semibold text-foreground hover:bg-secondary/50 transition-all cursor-pointer active:scale-95"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={onRestart}
            className="hud-panel px-4 py-2.5 font-hud text-sm font-semibold text-primary hover:bg-secondary/50 transition-all cursor-pointer active:scale-95"
          >
            Restart
          </button>
        </div>
      </div>

      {/* Pause overlay */}
      {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-md pointer-events-auto">
          <div className="text-center">
            <h2 className="font-racing text-5xl font-black text-foreground mb-2 tracking-wider">PAUSED</h2>
            <p className="font-hud text-muted-foreground mb-8 text-sm">Press Escape or click Resume to continue</p>
            <div className="flex gap-4 justify-center">
              <button onClick={onResume} className="px-8 py-3 bg-primary text-primary-foreground font-racing font-bold text-sm tracking-wider rounded-lg hover:opacity-90 transition-all cursor-pointer active:scale-95 glow-red">
                RESUME
              </button>
              <button onClick={onRestart} className="px-8 py-3 bg-secondary text-secondary-foreground font-racing font-bold text-sm tracking-wider rounded-lg hover:opacity-90 transition-all cursor-pointer active:scale-95">
                RESTART
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 font-hud text-[10px] text-muted-foreground/30 uppercase tracking-[0.3em]">
        WASD or Arrow Keys
      </div>
    </div>
  );
}
