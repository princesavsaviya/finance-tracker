import React from 'react';

export function StatCard({ label, value, accent = 'text-zinc-100', sub, hint }) {
  return (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded px-4 py-3">
      <div className="text-[10px] tracking-[0.2em] text-zinc-500 mb-1">{label}</div>
      <div className="font-mono tabular-nums">
        <span className={`text-xl sm:text-2xl font-semibold ${accent}`}>{value}</span>
        {sub && <span className="text-zinc-600 text-sm ml-1">{sub}</span>}
      </div>
      {hint && <div className="text-[10px] text-zinc-600 mt-1">{hint}</div>}
    </div>
  );
}

export function SectionHeader({ children, right }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="text-xs tracking-[0.2em] text-zinc-500">{children}</div>
      {right}
    </div>
  );
}

export function ProgressBar({ pct, color = 'bg-cyan-500' }) {
  return (
    <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }}></div>
    </div>
  );
}

export function EmptyState({ children }) {
  return <div className="text-zinc-600 text-sm py-8 text-center">{children}</div>;
}
