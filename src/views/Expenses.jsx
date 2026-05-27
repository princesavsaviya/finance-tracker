import React, { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { StatCard, SectionHeader, EmptyState } from '../components/Shared.jsx';
import { fmtMoney, todayStr, isInMonth, paymentMethodLabel, uid } from '../constants.js';

export default function Expenses({ entries, categories, cards, addEntry, deleteEntry }) {
  const [date, setDate] = useState(todayStr());
  const [category, setCategory] = useState(categories[0] || '');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [note, setNote] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');

  const submit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    addEntry({
      id: uid(),
      date,
      category,
      amount: amt,
      paymentMethod,
      note: note.trim(),
      recurringId: null,
    });
    setAmount(''); setNote('');
  };

  const monthTotal = useMemo(() =>
    entries.filter((e) => isInMonth(e.date)).reduce((s, e) => s + e.amount, 0),
    [entries]
  );
  const monthCount = useMemo(() => entries.filter((e) => isInMonth(e.date)).length, [entries]);

  const filtered = useMemo(() => {
    let r = [...entries];
    if (filterCategory !== 'all') r = r.filter((e) => e.category === filterCategory);
    if (filterPayment !== 'all') r = r.filter((e) => e.paymentMethod === filterPayment);
    return r.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  }, [entries, filterCategory, filterPayment]);

  const paymentOptions = useMemo(() => {
    const opts = [{ value: 'cash', label: 'Cash' }];
    cards.forEach((c) => opts.push({ value: `card-${c.id}`, label: `${c.name}${c.last4 ? ` ****${c.last4}` : ''}` }));
    return opts;
  }, [cards]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="THIS MONTH" value={fmtMoney(monthTotal)} accent="text-rose-400" />
        <StatCard label="ENTRIES MTD" value={monthCount} />
        <StatCard label="DAILY AVG" value={fmtMoney(monthCount > 0 ? monthTotal / new Date().getDate() : 0)} hint="avg per day MTD" />
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded p-4">
        <SectionHeader>LOG EXPENSE</SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-12 gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="col-span-2 md:col-span-2 bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm focus:outline-none focus:border-zinc-700 font-mono" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="col-span-2 md:col-span-2 bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm focus:outline-none focus:border-zinc-700">
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" step="0.01" min="0" placeholder="$ amount" className="col-span-1 md:col-span-2 bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm focus:outline-none focus:border-zinc-700 font-mono" />
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="col-span-1 md:col-span-2 bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm focus:outline-none focus:border-zinc-700">
            {paymentOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="note" className="col-span-2 md:col-span-3 bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm focus:outline-none focus:border-zinc-700" />
          <button onClick={submit} className="col-span-2 md:col-span-1 bg-zinc-100 text-zinc-900 rounded px-3 py-2 text-sm font-medium hover:bg-white flex items-center justify-center"><Plus size={16} /></button>
        </div>
        {cards.length === 0 && (
          <div className="mt-3 text-xs text-zinc-500">
            No cards configured. Add cards in <span className="text-zinc-300">Settings</span> to track per-card spending.
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="text-xs tracking-[0.2em] text-zinc-500">FILTER</div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none">
            <option value="all">all categories</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none">
            <option value="all">all methods</option>
            {paymentOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="text-xs text-zinc-600 ml-auto">{filtered.length} shown</div>
        </div>
        <div className="space-y-1">
          {filtered.length === 0 && <EmptyState>no expenses match</EmptyState>}
          {filtered.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-3 py-2.5 bg-zinc-900/30 border border-zinc-800 rounded hover:border-zinc-700 group">
              <div className="font-mono text-xs text-zinc-500 tabular-nums w-24 flex-shrink-0">{e.date}</div>
              <div className="flex-1 min-w-0">
                <div className="text-zinc-100 text-sm truncate">
                  {e.category}
                  {e.recurringId && <span className="ml-2 text-[10px] text-amber-400 font-mono">[recurring]</span>}
                </div>
                <div className="text-zinc-500 text-xs truncate">
                  {paymentMethodLabel(e.paymentMethod, cards)}{e.note ? ` · ${e.note}` : ''}
                </div>
              </div>
              <div className="font-mono text-rose-400 text-sm tabular-nums">-{fmtMoney(e.amount).replace('-', '')}</div>
              <button onClick={() => deleteEntry(e.id)} className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
