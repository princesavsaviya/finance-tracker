import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard, TrendingUp, ShoppingCart, Heart, PiggyBank, Settings as SettingsIcon,
  Loader2, AlertTriangle, Cloud, RefreshCw, LogOut, Users
} from 'lucide-react';
import { GitHub, ConflictError, loadConfig, clearConfig } from './github.js';
import { FILE_PATHS, DEFAULTS, fmtDate, todayStr, uid } from './constants.js';
import SetupModal from './SetupModal.jsx';
import Dashboard from './views/Dashboard.jsx';
import Income from './views/Income.jsx';
import Expenses from './views/Expenses.jsx';
import Donations from './views/Donations.jsx';
import Budgets from './views/Budgets.jsx';
import Owed from './views/Owed.jsx';
import SettingsView from './views/Settings.jsx';

export default function App() {
  const [config, setConfig] = useState(loadConfig());
  const [showSetup, setShowSetup] = useState(!loadConfig());
  const [showAccountModal, setShowAccountModal] = useState(false);

  const ghRef = useRef(null);
  useEffect(() => { ghRef.current = config ? new GitHub(config) : null; }, [config]);

  const [data, setData] = useState({
    settings:  { content: DEFAULTS.settings,  sha: null, loaded: false },
    income:    { content: DEFAULTS.income,    sha: null, loaded: false },
    expenses:  { content: DEFAULTS.expenses,  sha: null, loaded: false },
    donations: { content: DEFAULTS.donations, sha: null, loaded: false },
  });
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [syncError, setSyncError] = useState('');
  const timersRef = useRef({});

  const loadAll = useCallback(async () => {
    if (!ghRef.current) return;
    setLoading(true);
    setSyncError('');
    try {
      const [settings, income, expenses, donations] = await Promise.all([
        ghRef.current.fetchFile(FILE_PATHS.settings),
        ghRef.current.fetchFile(FILE_PATHS.income),
        ghRef.current.fetchFile(FILE_PATHS.expenses),
        ghRef.current.fetchFile(FILE_PATHS.donations),
      ]);
      // Merge fetched settings with defaults so new fields don't break older data
      const mergedSettings = settings.content
        ? { ...DEFAULTS.settings, ...settings.content }
        : DEFAULTS.settings;
      setData({
        settings:  { content: mergedSettings,                          sha: settings.sha,  loaded: true },
        income:    { content: income.content    ?? DEFAULTS.income,    sha: income.sha,    loaded: true },
        expenses:  { content: expenses.content  ?? DEFAULTS.expenses,  sha: expenses.sha,  loaded: true },
        donations: { content: donations.content ?? DEFAULTS.donations, sha: donations.sha, loaded: true },
      });
    } catch (e) {
      setSyncError(e.message);
      setSyncStatus('error');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (config && !showSetup) loadAll();
  }, [config, showSetup, loadAll]);

  const doSave = useCallback(async (key) => {
    if (!ghRef.current) return;
    const { content, sha } = dataRef.current[key];
    setSyncStatus('syncing');
    setSyncError('');
    try {
      const newSha = await ghRef.current.saveFile(FILE_PATHS[key], content, sha);
      setData((prev) => ({ ...prev, [key]: { ...prev[key], sha: newSha } }));
      setSyncStatus('saved');
      setTimeout(() => setSyncStatus((s) => (s === 'saved' ? 'idle' : s)), 1500);
    } catch (e) {
      if (e instanceof ConflictError) {
        setSyncStatus('conflict');
        setSyncError('Conflict detected. Reloading from GitHub.');
        await loadAll();
      } else {
        setSyncStatus('error');
        setSyncError(e.message);
      }
    }
  }, [loadAll]);

  const scheduleSave = useCallback((key) => {
    if (timersRef.current[key]) clearTimeout(timersRef.current[key]);
    timersRef.current[key] = setTimeout(() => doSave(key), 800);
  }, [doSave]);

  const update = useCallback((key, updater) => {
    setData((prev) => {
      const newContent = updater(prev[key].content);
      return { ...prev, [key]: { ...prev[key], content: newContent } };
    });
    scheduleSave(key);
  }, [scheduleSave]);

  // Domain operations
  const settings = data.settings.content;
  const updateSettings = (newSettings) => update('settings', () => newSettings);

  const addIncome = (entry) => update('income', (c) => ({ ...c, entries: [entry, ...c.entries] }));
  const deleteIncome = (id) => update('income', (c) => ({ ...c, entries: c.entries.filter((e) => e.id !== id) }));
  const updateIncome = (id, patch) => update('income', (c) => ({ ...c, entries: c.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));

  const addExpense = (entry) => update('expenses', (c) => ({ ...c, entries: [entry, ...c.entries] }));
  const deleteExpense = (id) => update('expenses', (c) => ({ ...c, entries: c.entries.filter((e) => e.id !== id) }));
  const updateExpense = (id, patch) => update('expenses', (c) => ({ ...c, entries: c.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));

  const addDonation = (entry) => update('donations', (c) => ({ ...c, entries: [entry, ...c.entries] }));
  const deleteDonation = (id) => update('donations', (c) => ({ ...c, entries: c.entries.filter((e) => e.id !== id) }));
  const updateDonation = (id, patch) => update('donations', (c) => ({ ...c, entries: c.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));

  const settleSplit = (expenseId, splitIdx) => {
    update('expenses', (c) => ({
      ...c,
      entries: c.entries.map((e) => {
        if (e.id !== expenseId) return e;
        const splits = [...(e.splits || [])];
        if (!splits[splitIdx]) return e;
        splits[splitIdx] = { ...splits[splitIdx], settled: true, settledDate: todayStr() };
        return { ...e, splits };
      }),
    }));
  };

  const unsettleSplit = (expenseId, splitIdx) => {
    update('expenses', (c) => ({
      ...c,
      entries: c.entries.map((e) => {
        if (e.id !== expenseId) return e;
        const splits = [...(e.splits || [])];
        if (!splits[splitIdx]) return e;
        splits[splitIdx] = { ...splits[splitIdx], settled: false, settledDate: null };
        return { ...e, splits };
      }),
    }));
  };

  const deleteSplit = (expenseId, splitIdx) => {
    update('expenses', (c) => ({
      ...c,
      entries: c.entries.map((e) => {
        if (e.id !== expenseId) return e;
        const splits = (e.splits || []).filter((_, i) => i !== splitIdx);
        return { ...e, splits };
      }),
    }));
  };

  const updateBudget = (category, amount) => {
    update('settings', (s) => ({
      ...s,
      budgets: amount > 0 ? { ...s.budgets, [category]: amount } : Object.fromEntries(Object.entries(s.budgets || {}).filter(([k]) => k !== category)),
    }));
  };

  // Recurring detection
  const recurringDue = useRecurringDue(settings.recurring || [], data.expenses.content.entries);

  const logRecurring = (r) => {
    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth(), r.dayOfMonth);
    addExpense({
      id: uid(),
      date: fmtDate(dueDate <= today ? dueDate : today),
      category: r.category,
      amount: r.amount,
      paymentMethod: r.paymentMethod,
      note: `Recurring: ${r.name}`,
      recurringId: r.id,
    });
    update('settings', (s) => ({
      ...s,
      recurring: s.recurring.map((x) => (x.id === r.id ? { ...x, lastGenerated: fmtDate(new Date(today.getFullYear(), today.getMonth(), r.dayOfMonth)) } : x)),
    }));
  };

  const dismissRecurring = (r) => {
    update('settings', (s) => ({
      ...s,
      recurring: s.recurring.map((x) => (x.id === r.id ? { ...x, lastGenerated: fmtDate(new Date(new Date().getFullYear(), new Date().getMonth(), r.dayOfMonth)) } : x)),
    }));
  };

  const [view, setView] = useState('dashboard');

  const handleSetupComplete = (cfg) => {
    setConfig(cfg);
    setShowSetup(false);
  };

  const handleLogout = () => {
    clearConfig();
    setConfig(null);
    setShowSetup(true);
    setShowAccountModal(false);
    setData({
      settings:  { content: DEFAULTS.settings,  sha: null, loaded: false },
      income:    { content: DEFAULTS.income,    sha: null, loaded: false },
      expenses:  { content: DEFAULTS.expenses,  sha: null, loaded: false },
      donations: { content: DEFAULTS.donations, sha: null, loaded: false },
    });
  };

  if (showSetup) return <SetupModal onComplete={handleSetupComplete} initial={config} />;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-500 font-mono text-sm">
        <Loader2 size={16} className="animate-spin mr-2" />
        loading from github...
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Header
          syncStatus={syncStatus} syncError={syncError}
          onSettings={() => setShowAccountModal(true)} onRefresh={loadAll}
        />
        <Nav view={view} setView={setView} />
        <div className="mt-6">
          {view === 'dashboard' && (
            <Dashboard
              data={data} settings={settings}
              onJumpTo={setView}
              recurringDue={recurringDue}
              onLogRecurring={logRecurring}
              onDismissRecurring={dismissRecurring}
            />
          )}
          {view === 'income' && (
            <Income
              entries={data.income.content.entries}
              sources={settings.incomeSources}
              donationRate={settings.donationRate}
              addEntry={addIncome}
              deleteEntry={deleteIncome}
              updateEntry={updateIncome}
            />
          )}
          {view === 'expenses' && (
            <Expenses
              entries={data.expenses.content.entries}
              categories={settings.expenseCategories}
              cards={settings.cards || []}
              people={settings.people || []}
              addEntry={addExpense}
              deleteEntry={deleteExpense}
              updateEntry={updateExpense}
              settleSplit={settleSplit}
              unsettleSplit={unsettleSplit}
              deleteSplit={deleteSplit}
            />
          )}
          {view === 'owed' && (
            <Owed
              expenses={data.expenses.content.entries}
              cards={settings.cards || []}
              settleSplit={settleSplit}
              unsettleSplit={unsettleSplit}
              deleteSplit={deleteSplit}
            />
          )}
          {view === 'donations' && (
            <Donations
              entries={data.donations.content.entries}
              income={data.income.content.entries}
              donationRate={settings.donationRate}
              addEntry={addDonation}
              deleteEntry={deleteDonation}
              updateEntry={updateDonation}
            />
          )}
          {view === 'budgets' && (
            <Budgets
              categories={settings.expenseCategories}
              budgets={settings.budgets || {}}
              expenses={data.expenses.content.entries}
              updateBudget={updateBudget}
            />
          )}
          {view === 'settings' && (
            <SettingsView settings={settings} updateSettings={updateSettings} />
          )}
        </div>
      </div>

      {showAccountModal && (
        <AccountModal
          config={config}
          onClose={() => setShowAccountModal(false)}
          onLogout={handleLogout}
          onReconfigure={() => { setShowAccountModal(false); setShowSetup(true); }}
        />
      )}
    </div>
  );
}

function useRecurringDue(recurring, expenses) {
  const today = new Date();
  const todayKey = fmtDate(today);
  const ym = todayKey.slice(0, 7); // YYYY-MM

  return recurring
    .filter((r) => r.active)
    .filter((r) => {
      const dueDate = new Date(today.getFullYear(), today.getMonth(), r.dayOfMonth);
      if (dueDate > today) return false; // not due yet this month
      const alreadyLogged = expenses.some((e) => e.recurringId === r.id && e.date.startsWith(ym));
      if (alreadyLogged) return false;
      if (r.lastGenerated && r.lastGenerated.startsWith(ym)) return false; // dismissed for this month
      return true;
    })
    .map((r) => ({
      ...r,
      dueDate: fmtDate(new Date(today.getFullYear(), today.getMonth(), r.dayOfMonth)),
    }));
}

function Header({ syncStatus, syncError, onSettings, onRefresh }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 sm:mb-8 pb-5 sm:pb-6 border-b border-zinc-800 gap-4">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="text-xs tracking-[0.2em] text-zinc-500">FINANCE // TRACKER</div>
          <SyncIndicator status={syncStatus} error={syncError} />
        </div>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight">
          {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
          <span className="text-zinc-500 font-mono ml-2 sm:ml-3 text-xl sm:text-2xl">{todayStr()}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={onRefresh} className="text-zinc-600 hover:text-zinc-200 p-1.5" title="Refresh from GitHub">
          <RefreshCw size={14} />
        </button>
        <button onClick={onSettings} className="text-zinc-600 hover:text-zinc-200 p-1.5" title="Account">
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}

function SyncIndicator({ status, error }) {
  if (status === 'syncing')  return <span className="text-amber-400 flex items-center gap-1 text-xs"><Loader2 size={10} className="animate-spin" />syncing</span>;
  if (status === 'saved')    return <span className="text-emerald-400 flex items-center gap-1 text-xs"><Cloud size={10} />saved</span>;
  if (status === 'error')    return <span className="text-red-400 flex items-center gap-1 text-xs" title={error}><AlertTriangle size={10} />error</span>;
  if (status === 'conflict') return <span className="text-orange-400 flex items-center gap-1 text-xs"><AlertTriangle size={10} />conflict</span>;
  return <span className="text-zinc-600 flex items-center gap-1 text-xs"><Cloud size={10} />synced</span>;
}

function Nav({ view, setView }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
    { id: 'income',    label: 'Income',    icon: <TrendingUp size={14} /> },
    { id: 'expenses',  label: 'Expenses',  icon: <ShoppingCart size={14} /> },
    { id: 'owed',      label: 'Owed',      icon: <Users size={14} /> },
    { id: 'donations', label: 'Donations', icon: <Heart size={14} /> },
    { id: 'budgets',   label: 'Budgets',   icon: <PiggyBank size={14} /> },
    { id: 'settings',  label: 'Settings',  icon: <SettingsIcon size={14} /> },
  ];
  return (
    <div className="flex gap-1 border-b border-zinc-800 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setView(t.id)}
          className={`px-3 sm:px-4 py-2.5 text-sm flex items-center gap-2 border-b-2 -mb-px transition-colors flex-shrink-0 ${
            view === t.id ? 'border-zinc-100 text-zinc-100' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  );
}

function AccountModal({ config, onClose, onLogout, onReconfigure }) {
  return (
    <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <div className="space-y-3 mb-6 text-sm">
          <div className="flex justify-between"><span className="text-zinc-500">Owner</span><span className="font-mono">{config?.owner}</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Repo</span><span className="font-mono">{config?.repo}</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Token</span><span className="font-mono">****{config?.token?.slice(-4)}</span></div>
        </div>
        <div className="space-y-2">
          <button onClick={onReconfigure} className="w-full bg-zinc-800 hover:bg-zinc-700 rounded px-4 py-2 text-sm">Reconfigure</button>
          <button onClick={onLogout} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded px-4 py-2 text-sm flex items-center justify-center gap-2">
            <LogOut size={14} /> Sign out (clear local token)
          </button>
          <button onClick={onClose} className="w-full text-zinc-500 hover:text-zinc-100 px-4 py-2 text-sm">Close</button>
        </div>
      </div>
    </div>
  );
}
