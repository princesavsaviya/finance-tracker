import React, { useState } from 'react';
import { Plus, Trash2, CreditCard, Repeat, Users } from 'lucide-react';
import { SectionHeader, EmptyState } from '../components/Shared.jsx';
import { fmtMoney, uid, paymentMethodLabel } from '../constants.js';

export default function Settings({ settings, updateSettings }) {
  const updateDonationRate = (v) => {
    const rate = parseFloat(v);
    if (isNaN(rate) || rate < 0 || rate > 1) return;
    updateSettings({ ...settings, donationRate: rate });
  };

  const addCard = (card) => {
    updateSettings({ ...settings, cards: [...(settings.cards || []), card] });
  };

  const deleteCard = (id) => {
    updateSettings({ ...settings, cards: settings.cards.filter((c) => c.id !== id) });
  };

  const addPerson = (person) => {
    updateSettings({ ...settings, people: [...(settings.people || []), person] });
  };

  const deletePerson = (id) => {
    updateSettings({ ...settings, people: (settings.people || []).filter((p) => p.id !== id) });
  };

  const addCategory = (name) => {
    const list = settings.expenseCategories || [];
    if (list.some((c) => c.toLowerCase() === name.toLowerCase())) return;
    updateSettings({ ...settings, expenseCategories: [...list, name] });
  };

  const deleteCategory = (name) => {
    updateSettings({ ...settings, expenseCategories: (settings.expenseCategories || []).filter((c) => c !== name) });
  };

  const addIncomeSource = (name) => {
    const list = settings.incomeSources || [];
    if (list.some((s) => s.toLowerCase() === name.toLowerCase())) return;
    updateSettings({ ...settings, incomeSources: [...list, name] });
  };

  const deleteIncomeSource = (name) => {
    updateSettings({ ...settings, incomeSources: (settings.incomeSources || []).filter((s) => s !== name) });
  };

  const addRecurring = (r) => {
    updateSettings({ ...settings, recurring: [...(settings.recurring || []), r] });
  };

  const updateRecurring = (id, patch) => {
    updateSettings({
      ...settings,
      recurring: settings.recurring.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });
  };

  const deleteRecurring = (id) => {
    updateSettings({ ...settings, recurring: settings.recurring.filter((r) => r.id !== id) });
  };

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader>DONATION RATE</SectionHeader>
        <div className="bg-zinc-900/30 border border-zinc-800 rounded p-4">
          <div className="flex items-center gap-3">
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={settings.donationRate}
              onChange={(e) => updateDonationRate(e.target.value)}
              className="w-24 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-700 font-mono"
            />
            <span className="text-zinc-500 text-sm">decimal · currently {(settings.donationRate * 100).toFixed(1)}%</span>
          </div>
          <div className="mt-2 text-xs text-zinc-600">
            Applied to all income entries to compute the running pledge total.
          </div>
        </div>
      </div>

      <CardSection cards={settings.cards || []} addCard={addCard} deleteCard={deleteCard} />

      <PeopleSection people={settings.people || []} addPerson={addPerson} deletePerson={deletePerson} />

      <TagSection
        title="EXPENSE CATEGORIES"
        items={settings.expenseCategories || []}
        addItem={addCategory}
        deleteItem={deleteCategory}
        placeholder="e.g., Pet Care"
        helpText="Used in the Expenses log dropdown. Deleting one does not affect past expenses tagged with it."
      />

      <TagSection
        title="INCOME SOURCES"
        items={settings.incomeSources || []}
        addItem={addIncomeSource}
        deleteItem={deleteIncomeSource}
        placeholder="e.g., Tutoring"
        helpText="Used in the Income log dropdown."
      />

      <RecurringSection
        recurring={settings.recurring || []}
        categories={settings.expenseCategories || []}
        cards={settings.cards || []}
        addRecurring={addRecurring}
        updateRecurring={updateRecurring}
        deleteRecurring={deleteRecurring}
      />
    </div>
  );
}

function CardSection({ cards, addCard, deleteCard }) {
  const [name, setName] = useState('');
  const [last4, setLast4] = useState('');

  const submit = () => {
    if (!name.trim()) return;
    addCard({ id: `c${uid()}`, name: name.trim(), last4: last4.trim() });
    setName(''); setLast4('');
  };

  return (
    <div>
      <SectionHeader>CARDS</SectionHeader>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded p-4 mb-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="Card name (e.g., Chase Freedom)" className="md:col-span-7 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-700" />
          <input value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="last 4" maxLength={4} className="md:col-span-4 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-700 font-mono" />
          <button onClick={submit} className="md:col-span-1 bg-zinc-100 text-zinc-900 rounded px-3 py-2 text-sm font-medium hover:bg-white flex items-center justify-center"><Plus size={16} /></button>
        </div>
      </div>
      <div className="space-y-1">
        {cards.length === 0 && <EmptyState>no cards yet</EmptyState>}
        {cards.map((c) => (
          <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 bg-zinc-900/30 border border-zinc-800 rounded group">
            <CreditCard size={14} className="text-zinc-500" />
            <div className="flex-1 min-w-0">
              <div className="text-zinc-100 text-sm truncate">{c.name}</div>
              {c.last4 && <div className="text-zinc-500 text-xs font-mono">****{c.last4}</div>}
            </div>
            <button onClick={() => deleteCard(c.id)} className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PeopleSection({ people, addPerson, deletePerson }) {
  const [name, setName] = useState('');

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (people.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) return;
    addPerson({ id: `p${uid()}`, name: trimmed });
    setName('');
  };

  return (
    <div>
      <SectionHeader>PEOPLE</SectionHeader>
      <div className="bg-zinc-900/30 border border-zinc-800 rounded p-3 mb-3 text-xs text-zinc-500">
        Add people you split expenses with. Names appear in the split picker on the Expenses tab.
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded p-4 mb-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="Name (e.g., Shashwat)" className="md:col-span-11 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-700" />
          <button onClick={submit} className="md:col-span-1 bg-zinc-100 text-zinc-900 rounded px-3 py-2 text-sm font-medium hover:bg-white flex items-center justify-center"><Plus size={16} /></button>
        </div>
      </div>
      <div className="space-y-1">
        {people.length === 0 && <EmptyState>no people yet</EmptyState>}
        {people.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 bg-zinc-900/30 border border-zinc-800 rounded group">
            <Users size={14} className="text-zinc-500" />
            <div className="flex-1 min-w-0">
              <div className="text-zinc-100 text-sm truncate">{p.name}</div>
            </div>
            <button onClick={() => deletePerson(p.id)} className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TagSection({ title, items, addItem, deleteItem, placeholder, helpText }) {
  const [value, setValue] = useState('');

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    addItem(trimmed);
    setValue('');
  };

  return (
    <div>
      <SectionHeader>{title}</SectionHeader>
      {helpText && (
        <div className="bg-zinc-900/30 border border-zinc-800 rounded p-3 mb-3 text-xs text-zinc-500">
          {helpText}
        </div>
      )}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded p-4 mb-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder={placeholder} className="md:col-span-11 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-700" />
          <button onClick={submit} className="md:col-span-1 bg-zinc-100 text-zinc-900 rounded px-3 py-2 text-sm font-medium hover:bg-white flex items-center justify-center"><Plus size={16} /></button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.length === 0 && <EmptyState>none yet</EmptyState>}
        {items.map((item) => (
          <div key={item} className="flex items-center gap-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md pl-3 pr-1 py-1 text-xs group">
            <span className="text-zinc-200">{item}</span>
            <button onClick={() => deleteItem(item)} className="text-zinc-600 hover:text-red-400 p-0.5 opacity-50 group-hover:opacity-100 transition">
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecurringSection({ recurring, categories, cards, addRecurring, updateRecurring, deleteRecurring }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Rent');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [dayOfMonth, setDayOfMonth] = useState(1);

  const paymentOptions = [{ value: 'cash', label: 'Cash' }, ...cards.map((c) => ({ value: `card-${c.id}`, label: `${c.name}${c.last4 ? ` ****${c.last4}` : ''}` }))];

  const submit = () => {
    const amt = parseFloat(amount);
    if (!name.trim() || !amt || amt <= 0) return;
    addRecurring({
      id: `r${uid()}`,
      name: name.trim(),
      amount: amt,
      category,
      paymentMethod,
      dayOfMonth: parseInt(dayOfMonth, 10) || 1,
      active: true,
      lastGenerated: null,
    });
    setName(''); setAmount(''); setDayOfMonth(1);
  };

  return (
    <div>
      <SectionHeader>RECURRING EXPENSES</SectionHeader>
      <div className="bg-zinc-900/30 border border-zinc-800 rounded p-3 mb-3 text-xs text-zinc-500">
        Templates for monthly bills. The app will prompt you to log them on or after the day of month you set. No silent auto-create.
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded p-4 mb-3">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g., Rent)" className="col-span-2 md:col-span-3 bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm focus:outline-none focus:border-zinc-700" />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" step="0.01" min="0" placeholder="$ amount" className="col-span-1 md:col-span-2 bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm focus:outline-none focus:border-zinc-700 font-mono" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="col-span-1 md:col-span-2 bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm focus:outline-none focus:border-zinc-700">
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="col-span-1 md:col-span-2 bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm focus:outline-none focus:border-zinc-700">
            {paymentOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} type="number" min="1" max="28" placeholder="day" title="day of month (1-28)" className="col-span-1 md:col-span-2 bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm focus:outline-none focus:border-zinc-700 font-mono" />
          <button onClick={submit} className="col-span-2 md:col-span-1 bg-zinc-100 text-zinc-900 rounded px-3 py-2 text-sm font-medium hover:bg-white flex items-center justify-center"><Plus size={16} /></button>
        </div>
      </div>
      <div className="space-y-1">
        {recurring.length === 0 && <EmptyState>no recurring expenses yet</EmptyState>}
        {recurring.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 bg-zinc-900/30 border border-zinc-800 rounded group">
            <Repeat size={14} className={r.active ? 'text-amber-400' : 'text-zinc-600'} />
            <div className="flex-1 min-w-0">
              <div className="text-zinc-100 text-sm truncate">{r.name} <span className="text-zinc-500 text-xs ml-1">· {r.category}</span></div>
              <div className="text-zinc-500 text-xs truncate">
                day {r.dayOfMonth} · {paymentMethodLabel(r.paymentMethod, cards)}
              </div>
            </div>
            <div className="font-mono text-zinc-100 text-sm tabular-nums">{fmtMoney(r.amount)}</div>
            <button
              onClick={() => updateRecurring(r.id, { active: !r.active })}
              className={`text-xs px-2 py-1 rounded border ${r.active ? 'border-amber-500/20 text-amber-400' : 'border-zinc-800 text-zinc-500'}`}
            >
              {r.active ? 'active' : 'paused'}
            </button>
            <button onClick={() => deleteRecurring(r.id)} className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
