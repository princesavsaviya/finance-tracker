import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Heart, DollarSign, Bell, Plus } from 'lucide-react';
import { StatCard, SectionHeader, ProgressBar, EmptyState } from '../components/Shared.jsx';
import { CashflowChart, CategoryDonut, DonationProgressChart } from '../components/Charts.jsx';
import {
  fmtMoney, isInMonth, isInYear, monthLabel, paymentMethodLabel,
} from '../constants.js';

export default function Dashboard({ data, settings, onJumpTo, recurringDue, onLogRecurring, onDismissRecurring }) {
  const now = new Date();
  const monthIncome = useMemo(() =>
    data.income.content.entries.filter((e) => isInMonth(e.date, now)).reduce((s, e) => s + e.amount, 0),
    [data.income.content.entries]
  );
  const monthExpenses = useMemo(() =>
    data.expenses.content.entries.filter((e) => isInMonth(e.date, now)).reduce((s, e) => s + e.amount, 0),
    [data.expenses.content.entries]
  );
  const yearIncome = useMemo(() =>
    data.income.content.entries.filter((e) => isInYear(e.date, now)).reduce((s, e) => s + e.amount, 0),
    [data.income.content.entries]
  );
  const yearDonated = useMemo(() =>
    data.donations.content.entries.filter((e) => isInYear(e.date, now)).reduce((s, e) => s + e.amount, 0),
    [data.donations.content.entries]
  );

  const pledgedYTD = yearIncome * (settings.donationRate || 0.25);
  const outstanding = pledgedYTD - yearDonated;
  const fulfillmentPct = pledgedYTD > 0 ? (yearDonated / pledgedYTD) * 100 : 0;

  const monthNet = monthIncome - monthExpenses;

  const recentTxns = useMemo(() => {
    const all = [
      ...data.income.content.entries.map((e) => ({ ...e, type: 'income' })),
      ...data.expenses.content.entries.map((e) => ({ ...e, type: 'expense' })),
      ...data.donations.content.entries.map((e) => ({ ...e, type: 'donation' })),
    ];
    return all.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 10);
  }, [data]);

  const topCategoriesMTD = useMemo(() => {
    const totals = {};
    data.expenses.content.entries.filter((e) => isInMonth(e.date, now)).forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [data.expenses.content.entries]);

  return (
    <div className="space-y-6">
      {recurringDue.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={14} className="text-amber-400" />
            <div className="text-xs tracking-[0.2em] text-amber-400">RECURRING DUE</div>
          </div>
          <div className="space-y-2">
            {recurringDue.map((r) => (
              <div key={`${r.id}-${r.dueDate}`} className="flex items-center justify-between gap-2 text-sm">
                <div className="flex-1 min-w-0">
                  <span className="text-zinc-100">{r.name}</span>
                  <span className="text-zinc-500 text-xs ml-2">{r.dueDate}</span>
                </div>
                <span className="font-mono text-amber-400 tabular-nums">{fmtMoney(r.amount)}</span>
                <button onClick={() => onLogRecurring(r)} className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded px-2 py-1">
                  Log
                </button>
                <button onClick={() => onDismissRecurring(r)} className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1">
                  Skip
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <SectionHeader>{monthLabel(now).toUpperCase()}</SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="INCOME" value={fmtMoney(monthIncome)} accent="text-emerald-400" />
          <StatCard label="EXPENSES" value={fmtMoney(monthExpenses)} accent="text-rose-400" />
          <StatCard label="NET" value={fmtMoney(monthNet, true)} accent={monthNet >= 0 ? 'text-cyan-400' : 'text-red-400'} />
          <StatCard label="PLEDGE +" value={fmtMoney(monthIncome * (settings.donationRate || 0.25))} accent="text-violet-400" hint={`${((settings.donationRate || 0.25) * 100).toFixed(0)}% of income`} />
        </div>
      </div>

      <div className="bg-zinc-900/30 border border-zinc-800 rounded p-4">
        <div className="flex items-center gap-2 mb-4">
          <Heart size={14} className="text-violet-400" />
          <div className="text-xs tracking-[0.2em] text-zinc-500">DONATION COMMITMENT (YTD)</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <StatCard label="PLEDGED" value={fmtMoney(pledgedYTD)} accent="text-violet-400" />
          <StatCard label="DONATED" value={fmtMoney(yearDonated)} accent="text-emerald-400" />
          <StatCard
            label="OUTSTANDING"
            value={fmtMoney(Math.max(0, outstanding))}
            accent={outstanding > 0 ? 'text-amber-400' : 'text-emerald-400'}
          />
        </div>
        <div className="flex items-center justify-between mb-1.5 text-xs">
          <span className="text-zinc-500">Fulfillment</span>
          <span className="font-mono text-zinc-400 tabular-nums">{fulfillmentPct.toFixed(0)}%</span>
        </div>
        <ProgressBar pct={fulfillmentPct} color={fulfillmentPct >= 100 ? 'bg-emerald-500' : fulfillmentPct >= 50 ? 'bg-amber-500' : 'bg-rose-500'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900/30 border border-zinc-800 rounded p-4">
          <SectionHeader>CASHFLOW (LAST 6 MONTHS)</SectionHeader>
          <CashflowChart income={data.income.content.entries} expenses={data.expenses.content.entries} />
        </div>
        <div className="bg-zinc-900/30 border border-zinc-800 rounded p-4">
          <SectionHeader>CATEGORIES THIS MONTH</SectionHeader>
          <CategoryDonut expenses={data.expenses.content.entries} />
        </div>
      </div>

      <div className="bg-zinc-900/30 border border-zinc-800 rounded p-4">
        <SectionHeader>DONATION PROGRESS YTD</SectionHeader>
        <DonationProgressChart
          income={data.income.content.entries}
          donations={data.donations.content.entries}
          rate={settings.donationRate || 0.25}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <SectionHeader>RECENT</SectionHeader>
          <div className="space-y-1">
            {recentTxns.length === 0 && <EmptyState>no transactions yet</EmptyState>}
            {recentTxns.map((t) => (
              <div key={`${t.type}-${t.id}`} className="flex items-center gap-3 px-3 py-2 bg-zinc-900/30 border border-zinc-800 rounded">
                <div className="font-mono text-[11px] text-zinc-500 tabular-nums w-20">{t.date}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-100 truncate">
                    {t.type === 'income' && (t.source || 'Income')}
                    {t.type === 'expense' && (t.category || 'Expense')}
                    {t.type === 'donation' && (t.recipient || 'Donation')}
                  </div>
                  {t.note && <div className="text-[11px] text-zinc-600 truncate">{t.note}</div>}
                </div>
                <span className={`font-mono text-sm tabular-nums ${
                  t.type === 'income' ? 'text-emerald-400' :
                  t.type === 'expense' ? 'text-rose-400' : 'text-violet-400'
                }`}>
                  {t.type === 'income' ? '+' : '-'}{fmtMoney(t.amount).replace('-', '')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionHeader>TOP CATEGORIES MTD</SectionHeader>
          <div className="space-y-3">
            {topCategoriesMTD.length === 0 && <EmptyState>no expenses this month</EmptyState>}
            {topCategoriesMTD.map(([cat, amt]) => {
              const pct = monthExpenses > 0 ? (amt / monthExpenses) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <span className="text-zinc-300">{cat}</span>
                    <div className="font-mono text-xs tabular-nums">
                      <span className="text-zinc-100">{fmtMoney(amt)}</span>
                      <span className="text-zinc-600 ml-2">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <ProgressBar pct={pct} color="bg-rose-500" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-2">
        <button onClick={() => onJumpTo('income')} className="bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 rounded px-3 py-3 text-sm flex items-center justify-center gap-2 text-emerald-400">
          <Plus size={14} /> Income
        </button>
        <button onClick={() => onJumpTo('expenses')} className="bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 rounded px-3 py-3 text-sm flex items-center justify-center gap-2 text-rose-400">
          <Plus size={14} /> Expense
        </button>
        <button onClick={() => onJumpTo('donations')} className="bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 rounded px-3 py-3 text-sm flex items-center justify-center gap-2 text-violet-400">
          <Plus size={14} /> Donation
        </button>
      </div>
    </div>
  );
}
