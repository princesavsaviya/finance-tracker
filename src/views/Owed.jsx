import React, { useMemo } from 'react';
import { Check, X, Users, ArrowRightLeft } from 'lucide-react';
import { StatCard, SectionHeader, EmptyState } from '../components/Shared.jsx';
import { fmtMoney, paymentMethodLabel } from '../constants.js';

export default function Owed({ expenses, cards, settleSplit, unsettleSplit, deleteSplit }) {
  const allSplits = useMemo(() => {
    const out = [];
    expenses.forEach((e) => {
      (e.splits || []).forEach((s, idx) => {
        out.push({
          expenseId: e.id,
          splitIdx: idx,
          date: e.date,
          category: e.category,
          paymentMethod: e.paymentMethod,
          expenseAmount: e.amount,
          expenseNote: e.note,
          person: s.person,
          amount: s.amount,
          settled: s.settled,
          settledDate: s.settledDate,
        });
      });
    });
    return out;
  }, [expenses]);

  const unsettled = useMemo(() => allSplits.filter((s) => !s.settled).sort((a, b) => b.date.localeCompare(a.date)), [allSplits]);
  const settled = useMemo(() => allSplits.filter((s) => s.settled).sort((a, b) => (b.settledDate || '').localeCompare(a.settledDate || '')), [allSplits]);

  const totalOwed = unsettled.reduce((s, x) => s + x.amount, 0);
  const totalSettled = settled.reduce((s, x) => s + x.amount, 0);

  const byPerson = useMemo(() => {
    const map = {};
    unsettled.forEach((s) => {
      if (!map[s.person]) map[s.person] = { total: 0, count: 0 };
      map[s.person].total += s.amount;
      map[s.person].count += 1;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [unsettled]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="OWED TO ME" value={fmtMoney(totalOwed)} accent="text-amber-400" />
        <StatCard label="PEOPLE" value={byPerson.length} />
        <StatCard label="OPEN ITEMS" value={unsettled.length} />
        <StatCard label="SETTLED" value={fmtMoney(totalSettled)} accent="text-emerald-400" hint="lifetime collected" />
      </div>

      <div>
        <SectionHeader>BY PERSON</SectionHeader>
        {byPerson.length === 0 ? (
          <EmptyState>nobody owes you anything right now</EmptyState>
        ) : (
          <div className="space-y-1">
            {byPerson.map(([person, { total, count }]) => (
              <div key={person} className="flex items-center gap-3 px-3 py-3 bg-zinc-900/30 border border-zinc-800 rounded">
                <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Users size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-zinc-100 text-sm font-medium truncate">{person}</div>
                  <div className="text-zinc-500 text-xs">{count} open {count === 1 ? 'item' : 'items'}</div>
                </div>
                <div className="font-mono text-amber-400 text-base tabular-nums">{fmtMoney(total)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <SectionHeader>UNSETTLED ({unsettled.length})</SectionHeader>
        <div className="space-y-1">
          {unsettled.length === 0 && <EmptyState>nothing pending</EmptyState>}
          {unsettled.map((s) => (
            <div key={`${s.expenseId}-${s.splitIdx}`} className="flex items-center gap-3 px-3 py-2.5 bg-zinc-900/30 border border-zinc-800 rounded hover:border-zinc-700 group">
              <div className="font-mono text-xs text-zinc-500 tabular-nums w-24 flex-shrink-0">{s.date}</div>
              <div className="flex-1 min-w-0">
                <div className="text-zinc-100 text-sm truncate">
                  <span className="text-amber-400 font-medium">{s.person}</span>
                  <span className="text-zinc-500 mx-1.5">·</span>
                  <span>{s.category}</span>
                </div>
                <div className="text-zinc-500 text-xs truncate">
                  total paid {fmtMoney(s.expenseAmount)} via {paymentMethodLabel(s.paymentMethod, cards)}{s.expenseNote ? ` · ${s.expenseNote}` : ''}
                </div>
              </div>
              <div className="font-mono text-amber-400 text-sm tabular-nums w-16 text-right">{fmtMoney(s.amount)}</div>
              <button
                onClick={() => settleSplit(s.expenseId, s.splitIdx)}
                className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded px-2 py-1 flex items-center gap-1"
                title="Mark as settled"
              >
                <Check size={12} /> Settle
              </button>
              <button
                onClick={() => deleteSplit(s.expenseId, s.splitIdx)}
                className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                title="Remove this split"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {settled.length > 0 && (
        <div>
          <SectionHeader>SETTLED HISTORY ({settled.length})</SectionHeader>
          <div className="space-y-1">
            {settled.slice(0, 20).map((s) => (
              <div key={`${s.expenseId}-${s.splitIdx}`} className="flex items-center gap-3 px-3 py-2.5 bg-zinc-900/20 border border-zinc-800/50 rounded group">
                <div className="font-mono text-xs text-zinc-600 tabular-nums w-24 flex-shrink-0">{s.settledDate || s.date}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-zinc-400 text-sm truncate">
                    <span className="text-zinc-300">{s.person}</span>
                    <span className="text-zinc-600 mx-1.5">·</span>
                    <span>{s.category}</span>
                  </div>
                </div>
                <div className="font-mono text-emerald-400/70 text-sm tabular-nums w-16 text-right line-through decoration-zinc-700">{fmtMoney(s.amount)}</div>
                <button
                  onClick={() => unsettleSplit(s.expenseId, s.splitIdx)}
                  className="text-xs text-zinc-500 hover:text-amber-400 px-2 py-1 opacity-0 group-hover:opacity-100 transition"
                  title="Mark as not settled (undo)"
                >
                  Undo
                </button>
              </div>
            ))}
            {settled.length > 20 && <div className="text-xs text-zinc-600 text-center py-2">{settled.length - 20} more not shown</div>}
          </div>
        </div>
      )}
    </div>
  );
}
