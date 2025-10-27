import React from 'react';
import { Rocket, MousePointer, Keyboard } from 'lucide-react';

export default function ControlsHelp() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm p-4" id="controls">
      <div className="flex items-center gap-2">
        <Rocket className="w-5 h-5 text-sky-600" />
        <h2 className="font-semibold text-slate-900">Controls</h2>
      </div>
      <ul className="mt-3 text-sm text-slate-700 space-y-2">
        <li className="flex items-center gap-2"><Keyboard className="w-4 h-4" /> Space / W / Up Arrow — Flap</li>
        <li className="flex items-center gap-2"><MousePointer className="w-4 h-4" /> Click / Tap — Flap</li>
        <li className="flex items-center gap-2"><Keyboard className="w-4 h-4" /> P — Pause / Resume</li>
        <li className="flex items-center gap-2"><Keyboard className="w-4 h-4" /> R — Restart</li>
      </ul>
      <p className="mt-3 text-xs text-slate-500">
        Tip: Collect stars to auto-fire at bosses. Rings give a shield that blocks one hit.
      </p>
    </section>
  );
}
