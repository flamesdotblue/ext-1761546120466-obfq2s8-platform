import React from 'react';
import HeroCover from './components/HeroCover';
import GameCanvas from './components/GameCanvas';
import GameHUD from './components/GameHUD';
import ControlsHelp from './components/ControlsHelp';

export default function App() {
  const [hudState, setHudState] = React.useState({
    level: 1,
    score: 0,
    lives: 3,
    paused: false,
    gameOver: false,
    victory: false,
  });

  const handleHudUpdate = (partial) => {
    setHudState((prev) => ({ ...prev, ...partial }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-white to-sky-50 text-slate-900">
      <HeroCover />
      <div className="max-w-5xl mx-auto px-4 pb-24">
        <div className="grid md:grid-cols-[2fr_1fr] gap-6">
          <div className="rounded-xl border border-slate-200 shadow-sm bg-white/80 backdrop-blur-sm">
            <GameCanvas onHudUpdate={handleHudUpdate} />
          </div>
          <div className="space-y-6">
            <GameHUD {...hudState} />
            <ControlsHelp />
          </div>
        </div>
      </div>
    </div>
  );
}
