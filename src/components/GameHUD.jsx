import React from 'react';
import { Star, Heart, Pause, Play, Trophy } from 'lucide-react';

export default function GameHUD({ level, score, lives, paused, gameOver, victory }) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm p-4" id="game">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <span className="font-semibold">Level</span>
        </div>
        <span className="text-slate-800 font-bold">{level}</span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-sky-500" />
          <span className="font-semibold">Score</span>
        </div>
        <span className="text-slate-800 font-bold">{score}</span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500" />
          <span className="font-semibold">Lives</span>
        </div>
        <span className="text-slate-800 font-bold">{lives}</span>
      </div>
      <div className="mt-4 flex items-center justify-center gap-2">
        {paused ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            <Play className="w-4 h-4" /> Paused
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            <Pause className="w-4 h-4" /> Running
          </div>
        )}
      </div>

      {gameOver && (
        <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-center text-rose-700 font-semibold">
          Game Over — Press R to try again
        </div>
      )}

      {victory && (
        <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center text-emerald-700 font-semibold">
          You beat all 10 levels! Press R to replay
        </div>
      )}
    </aside>
  );
}
