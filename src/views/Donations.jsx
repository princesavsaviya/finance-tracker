import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Pencil, Heart } from 'lucide-react';
import { StatCard, SectionHeader, ProgressBar, EmptyState } from '../components/Shared.jsx';
import { Modal, Field, ModalActions } from './Income.jsx';
import { fmtMoney, todayStr, isInMonth, isInYear, uid } from '../constants.js';

export default function Donations({ entries, income, donationRate, addEntry, deleteEntry, updateEntry }) {
  const [date, setDate] = useState(todayStr());
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState(null);

  const submit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !recipient.trim()) return;
    addEntry({
      id: uid(),
      date,
      recipient: recipient.trim(),
      amount: amt,
      note: note.trim(),
    });
    setRecipient(''); setAmount(''); setNote('');
  };

  const now = new Date();
  const yearPledgeableIncome = useMemo(() =>
    income.filter((e) => isInYear(e.date, now) && e.applyDonation !== false).reduce((s, e) => s + e.amount, 0),
    [income]
  );
  const monthPledgeableIncome = useMemo(() =>
    income.filter((e) => isInMonth(e.date, now) && e.applyDonation !== false).reduce((s, e) => s + e.amount, 0),
    [income]
  );
  const yearDonated = useMemo(() => entries.filter((e) => isInYear(e.date, now)).reduce((s, e) => s + e.amount, 0), [entries]);
  const monthDonated = useMemo(() => entries.filter((e) => isInMonth(e.date, now)).reduce((s, e) => s + e.amount, 0), [entries]);

  const pledgedYTD = yearPledgeableIncome * donationRate;
  const pledgedMTD = monthPledgeableIncome * donationRate;
  const outstanding = Math.max(0, pledgedYTD - yearDonated);
  const fulfillPct = pledgedYTD > 0 ? (yearDonated / pledgedYTD) * 100 : 0;

  const sorted = useMemo(() => [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id), [entries]);
  const editing = editingId ? entries.find((e) => e.id === editingId) : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="PLEDGED YTD" value={fmtMoney(pledgedYTD)} accent="text-violet-400" />
        <StatCard label="DONATED YTD" value={fmtMoney(yearDonated)} accent="text-emerald-400" />
        <StatCard label="OUTSTANDING" value={fmtMoney(outstanding)} accent={outstanding > 0 ? 'text-amber-400' : 'text-emerald-400'} />
        <StatCard label="MONTH PLEDGE" value={fmtMoney(pledgedMTD)} hint={`donated ${fmtMoney(monthDonated)}`} />
      </div>

      <div className="bg-zinc-900/30 border border-zinc-800 rounded p-4">
        <div className="flex items-center gap-2 mb-3">
          <Heart size={14} className="text-violet-400" />
          <div className="text-xs tracking-[0.2em] text-zinc-500">YTD FULFILLMENT</div>
          <div className="ml-auto font-mono text-sm tabular-nums">
            <span className={fulfillPct >= 100 ? 'text-emerald-400' : fulfillPct >= 50 ? 'text-amber-400' : 'text-rose-400'}>{fulfillPct.toFixed(0)}%</span>
          </div>
        </div>
        <ProgressBar pct={fulfillPct} color={fulfillPct >= 100 ? 'bg-emerald-500' : fulfillPct >= 50 ? 'bg-amber-500' : 'bg-rose-500'} />
        <div className="mt-3 text-xs text-zinc-500">
          Rate: <span className="font-mono text-zinc-300">{(donationRate * 100).toFixed(1)}%</span> of pledgeable income. Change in Settings.
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded p-4">
        <SectionHeader>LOG DONATION</SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-12 gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="col-span-2 md:col-span-2 bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm focus:outline-none focus:border-zinc-700 font-mono" />
          <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="recipient" className="col-span-2 md:col-span-4 bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm focus:outline-none focus:border-zinc-700" />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" step="0.01" min="0" placeholder="$ amount" className="col-span-1 md:col-span-2 bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm focus:outline-none focus:border-zinc-700 font-mono" />
          <input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="note" className="col-span-1 md:col-span-3 bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm focus:outline-none focus:border-zinc-700" />
          <button onClick={submit} className="col-span-2 md:col-span-1 bg-zinc-100 text-zinc-900 rounded px-3 py-2 text-sm font-medium hover:bg-white flex items-center justify-center"><Plus size={16} /></button>
        </div>
      </div>

      <div>
        <SectionHeader>RECENT ({entries.length})</SectionHeader>
        <div className="space-y-1">
          {sorted.length === 0 && <EmptyState>no donations logged</EmptyState>}
          {sorted.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-3 py-2.5 bg-zinc-900/30 border border-zinc-800 rounded hover:border-zinc-700 group">
              <div className="font-mono text-xs text-zinc-500 tabular-nums w-24 flex-shrink-0">{e.date}</div>
              <div className="flex-1 min-w-0">
                <div className="text-zinc-100 text-sm truncate">{e.recipient}</div>
                {e.note && <div className="text-zinc-500 text-xs truncate">{e.note}</div>}
              </div>
              <div className="font-mono text-violet-400 text-sm tabular-nums">{fmtMoney(e.amount)}</div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => setEditingId(e.id)} className="text-zinc-500 hover:text-zinc-100 p-1" title="Edit"><Pencil size={13} /></button>
                <button onClick={() => deleteEntry(e.id)} className="text-zinc-700 hover:text-red-400 p-1" title="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editing && (
        <EditDonationModal
          entry={editing}
          onSave={(patch) => { updateEntry(editing.id, patch); setEditingId(null); }}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}

function EditDonationModal({ entry, onSave, onClose }) {
  const [date, setDate] = useState(entry.date);
  const [recipient, setRecipient] = useState(entry.recipient);
  const [amount, setAmount] = useState(String(entry.amount));
  const [note, setNote] = useState(entry.note || '');

  const save = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !recipient.trim()) return;
    onSave({ date, recipient: recipient.trim(), amount: amt, note: note.trim() });
  };

  return (
    <Modal title="Edit Donation" onClose={onClose}>
      <div className="space-y-3">
        <Field label="DATE"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-700 font-mono" /></Field>
        <Field label="RECIPIENT"><input value={recipient} onChange={(e) => setRecipient(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-700" /></Field>
        <Field label="AMOUNT"><input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-700 font-mono" /></Field>
        <Field label="NOTE"><input value={note} onChange={(e) => setNote(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-700" /></Field>
      </div>
      <ModalActions onClose={onClose} onSave={save} />
    </Modal>
  );
}
