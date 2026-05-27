import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { isInMonth, isInYear, fmtMoney, netAmount } from '../constants.js';

const COLORS = {
  income: '#10b981',
  expense: '#f43f5e',
  donation: '#a78bfa',
  net: '#22d3ee',
  grid: '#27272a',
  axis: '#71717a',
  bg: '#18181b',
  bgBorder: '#27272a',
};

const PIE_COLORS = ['#10b981', '#f43f5e', '#a78bfa', '#22d3ee', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6'];

function TooltipBox({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs shadow-lg">
      {label && <div className="text-zinc-400 mb-1 font-mono">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }}></span>
          <span className="text-zinc-300">{p.name}:</span>
          <span className="font-mono text-zinc-100">{fmtMoney(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(d) {
  return d.toLocaleDateString('en-US', { month: 'short' });
}

export function CashflowChart({ income, expenses, months = 6 }) {
  const data = useMemo(() => {
    const now = new Date();
    const series = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      const inc = income.filter((e) => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
      const exp = expenses.filter((e) => e.date.startsWith(key)).reduce((s, e) => s + netAmount(e), 0);
      series.push({ month: monthLabel(d), Income: inc, Expenses: exp });
    }
    return series;
  }, [income, expenses, months]);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="month" stroke={COLORS.axis} fontSize={11} tickLine={false} />
        <YAxis stroke={COLORS.axis} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
        <Tooltip content={<TooltipBox />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Income" fill={COLORS.income} radius={[4, 4, 0, 0]} />
        <Bar dataKey="Expenses" fill={COLORS.expense} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonut({ expenses }) {
  const data = useMemo(() => {
    const totals = {};
    expenses.filter((e) => isInMonth(e.date)).forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + netAmount(e);
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  if (data.length === 0) {
    return <div className="text-zinc-600 text-sm py-12 text-center">no expenses this month</div>;
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />)}
          </Pie>
          <Tooltip content={<TooltipBox />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 w-full space-y-1.5">
        {data.slice(0, 6).map((d, i) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}></span>
              <span className="text-zinc-300 truncate">{d.name}</span>
            </div>
            <div className="font-mono tabular-nums text-zinc-400 flex-shrink-0 ml-2">
              {fmtMoney(d.value)} <span className="text-zinc-600 ml-1">{((d.value / total) * 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
        {data.length > 6 && <div className="text-[11px] text-zinc-600">+{data.length - 6} more</div>}
      </div>
    </div>
  );
}

export function DonationProgressChart({ income, donations, rate }) {
  const data = useMemo(() => {
    const now = new Date();
    const series = [];
    let cumPledge = 0;
    let cumDonated = 0;
    for (let m = 0; m <= now.getMonth(); m++) {
      const d = new Date(now.getFullYear(), m, 1);
      const key = monthKey(d);
      const monthInc = income.filter((e) => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
      const monthDon = donations.filter((e) => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
      cumPledge += monthInc * rate;
      cumDonated += monthDon;
      series.push({ month: monthLabel(d), Pledged: cumPledge, Donated: cumDonated });
    }
    return series;
  }, [income, donations, rate]);

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="month" stroke={COLORS.axis} fontSize={11} tickLine={false} />
        <YAxis stroke={COLORS.axis} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
        <Tooltip content={<TooltipBox />} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="Pledged" stroke={COLORS.donation} strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="Donated" stroke={COLORS.income} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
