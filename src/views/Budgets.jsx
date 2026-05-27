import React, { useState, useMemo } from 'react';
import { SectionHeader, ProgressBar, EmptyState } from '../components/Shared.jsx';
import { fmtMoney, isInMonth, netAmount } from '../constants.js';

export default function Budgets({ categories, budgets, expenses, updateBudget }) {
  const monthSpent = useMemo(() => {
    const totals = {};
    expenses.filter((e) => isInMonth(e.date)).forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + netAmount(e);
    });
    return totals;
  }, [expenses]);

  const totalBudget = Object.values(budgets).reduce((s, v) => s + (v || 0), 0);
  const totalSpent = Object.values(monthSpent).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <StatPill label="TOTAL BUDGET" value={fmtMoney(totalBudget)} />
        <StatPill label="SPENT MTD" value={fmtMoney(totalSpent)} accent={totalSpent > totalBudget && totalBudget > 0 ? 'text-rose-400' : 'text-zinc-100'} />
        <StatPill label="REMAINING" value={fmtMoney(Math.max(0, totalBudget - totalSpent))} accent={totalBudget - totalSpent < 0 ? 'text-rose-400' : 'text-emerald-400'} />
      </div>

      <div className="bg-zinc-900/30 border border-zinc-800 rounded p-4 text-xs text-zinc-500">
        Set a monthly budget per category. Leave blank to skip. Categories with no budget are not tracked here but still appear in expenses.
      </div>

      <div className="space-y-2">
        {categories.map((cat) => {
          const budget = budgets[cat] || 0;
          const spent = monthSpent[cat] || 0;
          const pct = budget > 0 ? (spent / budget) * 100 : 0;
          const color = pct >= 100 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
          const textColor = pct >= 100 ? 'text-rose-400' : pct >= 70 ? 'text-amber-400' : 'text-emerald-400';
          return (
            <div key={cat} className="bg-zinc-900/30 border border-zinc-800 rounded p-3">
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="text-sm text-zinc-100 truncate">{cat}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-zinc-500">$</span>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    value={budget || ''}
                    onChange={(e) => updateBudget(cat, e.target.value ? parseFloat(e.target.value) : 0)}
                    placeholder="0"
                    className="w-20 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-zinc-700 font-mono text-right"
                  />
                </div>
              </div>
              {budget > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <span className={`font-mono tabular-nums ${textColor}`}>{fmtMoney(spent)}</span>
                    <span className="font-mono text-zinc-500 tabular-nums">{pct.toFixed(0)}%</span>
                  </div>
                  <ProgressBar pct={pct} color={color} />
                  {pct >= 100 && (
                    <div className="mt-2 text-[11px] text-rose-400">
                      Over budget by {fmtMoney(spent - budget)}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-[11px] text-zinc-600">no budget set · spent {fmtMoney(spent)} MTD</div>
              )}
            </div>
          );
        })}
        {categories.length === 0 && <EmptyState>no categories configured</EmptyState>}
      </div>
    </div>
  );
}

function StatPill({ label, value, accent = 'text-zinc-100' }) {
  return (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded px-4 py-3">
      <div className="text-[10px] tracking-[0.2em] text-zinc-500 mb-1">{label}</div>
      <div className={`font-mono tabular-nums text-lg sm:text-xl font-semibold ${accent}`}>{value}</div>
    </div>
  );
}
