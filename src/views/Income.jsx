import React, { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { StatCard, SectionHeader, EmptyState } from '../components/Shared.jsx';
import { fmtMoney, todayStr, isInMonth, isInYear, uid } from '../constants.js';

export default function Income({ entries, sources, donationRate, addEntry, deleteEntry }) {
  const [date, setDate] = useState(todayStr());
  const [source, setSource] = useState(sources[0] || '');
  const [amount, setAmount] = useState('');
  const [hours, setHours] = useState('');
  const [note, setNote] = useState('');

  const submit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    addEntry({
      id: uid(),
      date,
      source: source.trim() || 'Other',
      amount: amt,
      hours: hours ? parseFloat(hours) : null,
      note: note.trim(),
    });
    setAmount(''); setHours(''); setNote('');
  };

  const monthTotal = useMemo(() =>
    entries.filter((e) => isInMonth(e.date)).reduce((s, e) => s + e.amount, 0),
    [entries]
  );
  const yearTotal = useMemo(() =>
    entries.filter((e) => isInYear(e.date)).reduce((s, e) => s + e.amount, 0),
    [entries]
  );
  const sorted = useMemo(() => [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id), [entries]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="THIS MONTH" value={fmtMoney(monthTotal)} accent="text-emerald-400" />
        <StatCard label="THIS YEAR" value={fmtMoney(yearTotal)} accent="text-emerald-400" />
        <StatCard label="PLEDGE YTD" value={fmtMoney(yearTotal * donationRate)} accent="text-violet-400" hint={`auto ${(donationRate * 100).toFixed(0)}%`} />
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded p-4">
        <SectionHeader>LOG INCOME</SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-12 gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="col-span-2 md:col-span-2 bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm focus:outline-none focus:border-zinc-700 font-mono" />
          <select value={source} onChange={(e) => setSource(e.target.value)} className="col-span-2 md:col-span-3 bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm focus:outline-none focus:border-zinc-700">
            {sources.map((s) => <option key={s}>{s}</option>)}
          </select>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" step="0.01" min="0" placeholder="$ amount" className="col-span-1 md:col-span-2 bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm focus:outline-none focus:border-zinc-700 font-mono" />
          <input value={hours} onChange={(e) => setHours(e.target.value)} type="number" step="0.25" min="0" placeholder="hrs" className="col-span-1 md:col-span-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm focus:outline-none focus:border-zinc-700 font-mono" />
          <input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="note" className="col-span-2 md:col-span-3 bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm focus:outline-none focus:border-zinc-700" />
          <button onClick={submit} className="col-span-2 md:col-span-1 bg-zinc-100 text-zinc-900 rounded px-3 py-2 text-sm font-medium hover:bg-white flex items-center justify-center"><Plus size={16} /></button>
        </div>
        {amount && parseFloat(amount) > 0 && (
          <div className="mt-3 text-xs text-zinc-500">
            Donation pledge from this entry: <span className="font-mono text-violet-400">{fmtMoney(parseFloat(amount) * donationRate)}</span>
          </div>
        )}
      </div>

      <div>
        <SectionHeader>RECENT ({entries.length})</SectionHeader>
        <div className="space-y-1">
          {sorted.length === 0 && <EmptyState>no income logged</EmptyState>}
          {sorted.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-3 py-2.5 bg-zinc-900/30 border border-zinc-800 rounded hover:border-zinc-700 group">
              <div className="font-mono text-xs text-zinc-500 tabular-nums w-24 flex-shrink-0">{e.date}</div>
              <div className="flex-1 min-w-0">
                <div className="text-zinc-100 text-sm truncate">{e.source}</div>
                <div className="text-zinc-500 text-xs truncate">
                  {e.hours ? `${e.hours} hrs` : ''}{e.hours && e.note ? ' · ' : ''}{e.note}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-emerald-400 text-sm tabular-nums">+{fmtMoney(e.amount).replace('-', '')}</div>
                <div className="font-mono text-violet-400 text-[10px] tabular-nums">pledge {fmtMoney(e.amount * donationRate)}</div>
              </div>
              <button onClick={() => deleteEntry(e.id)} className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
