import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Pencil, X, Heart, HeartOff } from 'lucide-react';
import { StatCard, SectionHeader, EmptyState } from '../components/Shared.jsx';
import { fmtMoney, todayStr, isInMonth, isInYear, uid } from '../constants.js';

export default function Income({ entries, sources, donationRate, addEntry, deleteEntry, updateEntry }) {
  const [date, setDate] = useState(todayStr());
  const [source, setSource] = useState(sources[0] || '');
  const [amount, setAmount] = useState('');
  const [hours, setHours] = useState('');
  const [note, setNote] = useState('');
  const [applyDonation, setApplyDonation] = useState(true);
  const [editingId, setEditingId] = useState(null);

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
      applyDonation,
    });
    setAmount(''); setHours(''); setNote('');
    // donation toggle stays as user set it for the session
  };

  const monthTotal = useMemo(() =>
    entries.filter((e) => isInMonth(e.date)).reduce((s, e) => s + e.amount, 0),
    [entries]
  );
  const yearTotal = useMemo(() =>
    entries.filter((e) => isInYear(e.date)).reduce((s, e) => s + e.amount, 0),
    [entries]
  );
  const yearPledgeable = useMemo(() =>
    entries.filter((e) => isInYear(e.date) && e.applyDonation !== false).reduce((s, e) => s + e.amount, 0),
    [entries]
  );
  const sorted = useMemo(() => [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id), [entries]);
  const editing = editingId ? entries.find((e) => e.id === editingId) : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="THIS MONTH" value={fmtMoney(monthTotal)} accent="text-emerald-400" />
        <StatCard label="THIS YEAR" value={fmtMoney(yearTotal)} accent="text-emerald-400" />
        <StatCard label="PLEDGE YTD" value={fmtMoney(yearPledgeable * donationRate)} accent="text-violet-400" hint={`${(donationRate * 100).toFixed(0)}% of pledgeable income`} />
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

        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setApplyDonation(!applyDonation)}
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded border transition ${
              applyDonation
                ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
            }`}
          >
            {applyDonation ? <Heart size={12} fill="currentColor" /> : <HeartOff size={12} />}
            {applyDonation ? 'Donation applies' : 'Skip donation'}
          </button>
          {amount && parseFloat(amount) > 0 && applyDonation && (
            <span className="text-xs text-zinc-500">
              pledge from this entry: <span className="font-mono text-violet-400">{fmtMoney(parseFloat(amount) * donationRate)}</span>
            </span>
          )}
          {amount && parseFloat(amount) > 0 && !applyDonation && (
            <span className="text-xs text-zinc-500 italic">no donation pledge from this entry</span>
          )}
        </div>
      </div>

      <div>
        <SectionHeader>RECENT ({entries.length})</SectionHeader>
        <div className="space-y-1">
          {sorted.length === 0 && <EmptyState>no income logged</EmptyState>}
          {sorted.map((e) => {
            const pledges = e.applyDonation !== false;
            return (
              <div key={e.id} className="flex items-center gap-3 px-3 py-2.5 bg-zinc-900/30 border border-zinc-800 rounded hover:border-zinc-700 group">
                <div className="font-mono text-xs text-zinc-500 tabular-nums w-24 flex-shrink-0">{e.date}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-zinc-100 text-sm truncate flex items-center gap-2">
                    <span>{e.source}</span>
                    {!pledges && <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800/60 border border-zinc-800 rounded px-1.5 py-0.5">no donation</span>}
                  </div>
                  <div className="text-zinc-500 text-xs truncate">
                    {e.hours ? `${e.hours} hrs` : ''}{e.hours && e.note ? ' · ' : ''}{e.note}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-emerald-400 text-sm tabular-nums">+{fmtMoney(e.amount).replace('-', '')}</div>
                  {pledges && (
                    <div className="font-mono text-violet-400 text-[10px] tabular-nums">pledge {fmtMoney(e.amount * donationRate)}</div>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => setEditingId(e.id)} className="text-zinc-500 hover:text-zinc-100 p-1" title="Edit"><Pencil size={13} /></button>
                  <button onClick={() => deleteEntry(e.id)} className="text-zinc-700 hover:text-red-400 p-1" title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editing && (
        <EditIncomeModal
          entry={editing}
          sources={sources}
          donationRate={donationRate}
          onSave={(patch) => { updateEntry(editing.id, patch); setEditingId(null); }}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}

function EditIncomeModal({ entry, sources, donationRate, onSave, onClose }) {
  const [date, setDate] = useState(entry.date);
  const [source, setSource] = useState(entry.source);
  const [amount, setAmount] = useState(String(entry.amount));
  const [hours, setHours] = useState(entry.hours != null ? String(entry.hours) : '');
  const [note, setNote] = useState(entry.note || '');
  const [applyDonation, setApplyDonation] = useState(entry.applyDonation !== false);

  const save = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    onSave({
      date,
      source: source.trim() || 'Other',
      amount: amt,
      hours: hours ? parseFloat(hours) : null,
      note: note.trim(),
      applyDonation,
    });
  };

  return (
    <Modal title="Edit Income" onClose={onClose}>
      <div className="space-y-3">
        <Field label="DATE"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-700 font-mono" /></Field>
        <Field label="SOURCE">
          <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-700">
            {(sources.includes(source) ? sources : [source, ...sources]).map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="AMOUNT"><input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-700 font-mono" /></Field>
          <Field label="HOURS"><input type="number" step="0.25" min="0" value={hours} onChange={(e) => setHours(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-700 font-mono" /></Field>
        </div>
        <Field label="NOTE"><input value={note} onChange={(e) => setNote(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-700" /></Field>
        <button
          onClick={() => setApplyDonation(!applyDonation)}
          className={`w-full flex items-center justify-center gap-2 text-xs px-3 py-2 rounded border transition ${
            applyDonation
              ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
              : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
          }`}
        >
          {applyDonation ? <Heart size={12} fill="currentColor" /> : <HeartOff size={12} />}
          {applyDonation ? `Donation applies (${fmtMoney(parseFloat(amount || 0) * donationRate)})` : 'Skip donation for this entry'}
        </button>
      </div>
      <ModalActions onClose={onClose} onSave={save} />
    </Modal>
  );
}

export function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md w-full my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-100"><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.2em] text-zinc-500 mb-1">{label}</div>
      {children}
    </div>
  );
}

export function ModalActions({ onClose, onSave }) {
  return (
    <div className="flex gap-2 mt-5 pt-4 border-t border-zinc-800">
      <button onClick={onClose} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded px-4 py-2 text-sm">Cancel</button>
      <button onClick={onSave} className="flex-1 bg-zinc-100 hover:bg-white text-zinc-900 rounded px-4 py-2 text-sm font-medium">Save</button>
    </div>
  );
}
