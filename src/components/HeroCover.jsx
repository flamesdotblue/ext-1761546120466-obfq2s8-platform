import React from 'react';
import Spline from '@splinetool/react-spline';

export default function HeroCover() {
  return (
    <section className="w-full relative" style={{ height: '60vh' }}>
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/OIGfFUmCnZ3VD8gH/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/30 to-white/80 pointer-events-none" />
      <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-extrabold tracking-tight text-slate-900 text-4xl sm:text-5xl md:text-6xl drop-shadow-sm">
          Flappy Quest: Sky Worlds
        </h1>
        <p className="mt-4 max-w-2xl text-slate-700 text-base sm:text-lg">
          A friendly Flappy adventure with power-ups, mini-bosses, and 10 levels to victory.
        </p>
        <div className="mt-6 inline-flex gap-3">
          <a href="#game" className="rounded-full bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 text-sm font-semibold transition-colors">Start Playing</a>
          <a href="#controls" className="rounded-full bg-white/80 hover:bg-white text-sky-700 border border-sky-200 px-5 py-2.5 text-sm font-semibold transition-colors">How to Play</a>
        </div>
      </div>
    </section>
  );
}
