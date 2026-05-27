import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Users, X, ChevronDown, ChevronUp, Check, Pencil } from 'lucide-react';
import { StatCard, SectionHeader, EmptyState } from '../components/Shared.jsx';
import { Modal, Field, ModalActions } from './Income.jsx';
import { fmtMoney, todayStr, isInMonth, paymentMethodLabel, uid } from '../constants.js';

export default function Expenses({ entries, categories, cards, people, addEntry, deleteEntry, updateEntry, settleSplit, unsettleSplit, deleteSplit }) {
  const [date, setDate] = useState(todayStr());
  const [category, setCategory] = useState(categories[0] || '');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [note, setNote] = useState('');
  const [splitOpen, setSplitOpen] = useState(false);
  const [splits, setSplits] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [editingId, setEditingId] = useState(null);

  const submit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    const cleanSplits = splits
      .filter((s) => s.person && parseFloat(s.amount) > 0)
      .map((s) => ({ person: s.person, amount: parseFloat(s.amount), settled: false, settledDate: null }));
    addEntry({
      id: uid(),
      date, category, amount: amt, paymentMethod, note: note.trim(),
      recurringId: null,
      splits: cleanSplits,
    });
    setAmount(''); setNote(''); setSplits([]); setSplitOpen(false);
  };

  const addSplitRow = () => {
    setSplits([...splits, { person: people[0]?.name || '', amount: '' }]);
  };

  const updateSplitRow = (idx, patch) => {
    setSplits(splits.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const removeSplitRow = (idx) => {
    setSplits(splits.filter((_, i) => i !== idx));
  };

  const splitTotal = splits.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
  const yourShare = parseFloat(amount || 0) - splitTotal;

  const equalSplit = () => {
    const amt = parseFloat(amount);
    if (!amt || splits.length === 0) return;
    const share = (amt / (splits.length + 1)).toFixed(2);
    setSplits(splits.map((s) => ({ ...s, amount: share })));
  };

  const monthTotal = useMemo(() => entries.filter((e) => isInMonth(e.date)).reduce((s, e) => s + e.amount, 0), [entries]);
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

        <button
          onClick={() => setSplitOpen(!splitOpen)}
          className="mt-3 text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5"
        >
          {splitOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          <Users size={12} />
          Split this expense {splits.length > 0 && <span className="text-amber-400">({splits.length})</span>}
        </button>

        {splitOpen && (
          <div className="mt-3 border-t border-zinc-800 pt-3 space-y-2">
            {people.length === 0 && (
              <div className="text-xs text-zinc-500">
                Add people in <span className="text-zinc-300">Settings</span> first.
              </div>
            )}
            {splits.map((s, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <select
                  value={s.person}
                  onChange={(e) => updateSplitRow(idx, { person: e.target.value })}
                  className="col-span-6 bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-zinc-700"
                >
                  <option value="">select person...</option>
                  {people.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={s.amount}
                  onChange={(e) => updateSplitRow(idx, { amount: e.target.value })}
                  placeholder="$ they owe"
                  className="col-span-5 bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-zinc-700 font-mono"
                />
                <button onClick={() => removeSplitRow(idx)} className="col-span-1 text-zinc-600 hover:text-red-400 flex items-center justify-center">
                  <X size={14} />
                </button>
              </div>
            ))}
            {people.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <button onClick={addSplitRow} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                  <Plus size={12} /> Add person
                </button>
                {splits.length > 0 && parseFloat(amount) > 0 && (
                  <button onClick={equalSplit} className="text-xs text-zinc-400 hover:text-zinc-200">
                    Equal split
                  </button>
                )}
              </div>
            )}
            {splits.length > 0 && parseFloat(amount) > 0 && (
              <div className="text-xs text-zinc-500 pt-1 font-mono">
                they owe total: <span className="text-amber-400">{fmtMoney(splitTotal)}</span>
                {' · '}
                your share: <span className={yourShare < 0 ? 'text-red-400' : 'text-zinc-300'}>{fmtMoney(yourShare)}</span>
                {yourShare < 0 && <span className="text-red-400"> (splits exceed total)</span>}
              </div>
            )}
          </div>
        )}

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
          {filtered.map((e) => {
            const hasSplits = (e.splits || []).length > 0;
            const unsettledSplits = (e.splits || []).filter((s) => !s.settled);
            const unsettledTotal = unsettledSplits.reduce((s, x) => s + x.amount, 0);
            return (
              <div key={e.id} className="bg-zinc-900/30 border border-zinc-800 rounded hover:border-zinc-700 group">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <div className="font-mono text-xs text-zinc-500 tabular-nums w-24 flex-shrink-0">{e.date}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-zinc-100 text-sm truncate flex items-center gap-2">
                      <span>{e.category}</span>
                      {e.recurringId && <span className="text-[10px] text-amber-400 font-mono">[recurring]</span>}
                      {hasSplits && (
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5 flex items-center gap-1">
                          <Users size={10} /> {(e.splits || []).length}
                        </span>
                      )}
                    </div>
                    <div className="text-zinc-500 text-xs truncate">
                      {paymentMethodLabel(e.paymentMethod, cards)}{e.note ? ` · ${e.note}` : ''}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono text-rose-400 text-sm tabular-nums">-{fmtMoney(e.amount).replace('-', '')}</div>
                    {unsettledTotal > 0 && (
                      <div className="font-mono text-amber-400 text-[10px] tabular-nums">owed back {fmtMoney(unsettledTotal)}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => setEditingId(e.id)} className="text-zinc-500 hover:text-zinc-100 p-1" title="Edit"><Pencil size={13} /></button>
                    <button onClick={() => deleteEntry(e.id)} className="text-zinc-700 hover:text-red-400 p-1" title="Delete"><Trash2 size={14} /></button>
                  </div>
                </div>
                {hasSplits && (
                  <div className="border-t border-zinc-800 px-3 py-2 space-y-1">
                    {(e.splits || []).map((s, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className={`tabular-nums ${s.settled ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {s.settled ? '✓' : '○'}
                        </span>
                        <span className={s.settled ? 'text-zinc-500 line-through' : 'text-zinc-300'}>
                          {s.person}
                        </span>
                        <span className={`font-mono tabular-nums ${s.settled ? 'text-zinc-600' : 'text-amber-400'}`}>
                          {fmtMoney(s.amount)}
                        </span>
                        {s.settled && s.settledDate && (
                          <span className="text-zinc-600 font-mono">· settled {s.settledDate}</span>
                        )}
                        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          {!s.settled ? (
                            <button onClick={() => settleSplit(e.id, idx)} className="text-emerald-400 hover:text-emerald-300 text-[10px] flex items-center gap-0.5">
                              <Check size={10} /> settle
                            </button>
                          ) : (
                            <button onClick={() => unsettleSplit(e.id, idx)} className="text-zinc-500 hover:text-amber-400 text-[10px]">
                              undo
                            </button>
                          )}
                          <button onClick={() => deleteSplit(e.id, idx)} className="text-zinc-600 hover:text-red-400">
                            <X size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {editingId && (() => {
        const e = entries.find((x) => x.id === editingId);
        if (!e) return null;
        return (
          <EditExpenseModal
            entry={e}
            categories={categories}
            cards={cards}
            onSave={(patch) => { updateEntry(editingId, patch); setEditingId(null); }}
            onClose={() => setEditingId(null)}
          />
        );
      })()}
    </div>
  );
}

function EditExpenseModal({ entry, categories, cards, onSave, onClose }) {
  const [date, setDate] = useState(entry.date);
  const [category, setCategory] = useState(entry.category);
  const [amount, setAmount] = useState(String(entry.amount));
  const [paymentMethod, setPaymentMethod] = useState(entry.paymentMethod || 'cash');
  const [note, setNote] = useState(entry.note || '');

  const paymentOptions = [
    { value: 'cash', label: 'Cash' },
    ...cards.map((c) => ({ value: `card-${c.id}`, label: `${c.name}${c.last4 ? ` ****${c.last4}` : ''}` })),
  ];

  const save = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    onSave({ date, category, amount: amt, paymentMethod, note: note.trim() });
  };

  const allCategories = categories.includes(category) ? categories : [category, ...categories];

  return (
    <Modal title="Edit Expense" onClose={onClose}>
      <div className="space-y-3">
        <Field label="DATE"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-700 font-mono" /></Field>
        <Field label="CATEGORY">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-700">
            {allCategories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="AMOUNT"><input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-700 font-mono" /></Field>
        <Field label="PAYMENT">
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-700">
            {paymentOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="NOTE"><input value={note} onChange={(e) => setNote(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-700" /></Field>
        {(entry.splits || []).length > 0 && (
          <div className="text-xs text-zinc-500 bg-zinc-950/50 border border-zinc-800 rounded p-2">
            This expense has {(entry.splits || []).length} split(s). Manage them from the Expenses list or Owed tab.
          </div>
        )}
      </div>
      <ModalActions onClose={onClose} onSave={save} />
    </Modal>
  );
}
