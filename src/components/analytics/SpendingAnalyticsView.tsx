import React, { useState, useMemo } from 'react';
import {
  PieChart,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sliders,
  DollarSign,
  Repeat,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { TransactionCategory, Transaction } from '../../types/banking';

type Timeframe = 'current-month' | 'last-month' | 'last-90' | 'ytd';

interface SpendingAnalyticsViewProps {
  onSelectTransaction: (tx: Transaction) => void;
}

export const SpendingAnalyticsView: React.FC<SpendingAnalyticsViewProps> = ({
  onSelectTransaction,
}) => {
  const {
    transactions,
    budgets,
    recurring,
    updateBudgetLimit,
    toggleRecurringItem,
    security,
  } = useBanking();

  const [timeframe, setTimeframe] = useState<Timeframe>('current-month');
  const [editingCategory, setEditingCategory] = useState<TransactionCategory | null>(null);
  const [editLimitVal, setEditLimitVal] = useState<string>('');

  // Filter transactions by timeframe
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (tx.category === 'Transfer') return false; // Internal transfers do not count as net consumption

      if (timeframe === 'current-month') {
        return tx.date.startsWith('2026-10');
      } else if (timeframe === 'last-month') {
        return tx.date.startsWith('2026-09');
      } else if (timeframe === 'last-90') {
        return tx.date >= '2026-08-01';
      } else {
        return tx.date.startsWith('2026');
      }
    });
  }, [transactions, timeframe]);

  // Aggregate expenses & income
  const totalExpenses = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const netSavings = Math.max(0, totalIncome - totalExpenses);
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Breakdown by Category
  const categoryStats = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    filteredTransactions
      .filter((t) => t.type === 'debit')
      .forEach((t) => {
        if (!map[t.category]) {
          map[t.category] = { total: 0, count: 0 };
        }
        map[t.category].total += t.amount;
        map[t.category].count += 1;
      });

    return Object.entries(map)
      .map(([cat, stat]) => {
        const budgetItem = budgets.find((b) => b.category === cat);
        const limit = budgetItem ? budgetItem.monthlyLimit : 1000;
        const percentOfBudget = Math.round((stat.total / (limit || 1)) * 100);
        const shareOfSpend = totalExpenses > 0 ? Math.round((stat.total / totalExpenses) * 100) : 0;
        return {
          category: cat as TransactionCategory,
          total: stat.total,
          count: stat.count,
          average: stat.total / stat.count,
          limit,
          percentOfBudget,
          shareOfSpend,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [filteredTransactions, budgets, totalExpenses]);

  // Handle edit budget limit
  const handleStartEdit = (cat: TransactionCategory, currentLimit: number) => {
    setEditingCategory(cat);
    setEditLimitVal(currentLimit.toString());
  };

  const handleSaveBudget = (cat: TransactionCategory) => {
    const val = parseFloat(editLimitVal);
    if (!isNaN(val) && val > 0) {
      updateBudgetLimit(cat, val);
      setEditingCategory(null);
    }
  };

  // Monthly Recurring Total
  const activeRecurring = recurring.filter((r) => r.active);
  const monthlyRecurringSum = activeRecurring.reduce((sum, r) => sum + r.amount, 0);
  const annualizedRecurring = monthlyRecurringSum * 12;

  // Monthly bar chart data simulation
  const monthlyChartData = [
    { month: 'Jun', income: 7850, expenses: 4120 },
    { month: 'Jul', income: 8200, expenses: 4480 },
    { month: 'Aug', income: 9400, expenses: 5100 },
    { month: 'Sep', income: 15399, expenses: 4945 },
    { month: 'Oct', income: 7850, expenses: 4353 },
  ];

  return (
    <div className="space-y-8">
      {/* Header & Timeframe Select */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-400" />
            <span>Spending Habits & Budget Intelligence</span>
          </h1>
          <p className="text-xs text-slate-400">
            Automated consumption analysis, category limits, and recurring subscription surveillance
          </p>
        </div>

        {/* Timeframe Filter Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto self-start sm:self-auto">
          {[
            { id: 'current-month', label: 'Oct 2026' },
            { id: 'last-month', label: 'Sep 2026' },
            { id: 'last-90', label: 'Past 90 Days' },
            { id: 'ytd', label: 'Year-to-Date' },
          ].map((tf) => (
            <button
              key={tf.id}
              type="button"
              onClick={() => setTimeframe(tf.id as Timeframe)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                timeframe === tf.id
                  ? 'bg-emerald-400 text-slate-950 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Outflow (Spend)</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white tabular-nums">
            {formatCurrency(totalExpenses, security.privacyMode)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            {filteredTransactions.filter((t) => t.type === 'debit').length} transactions in timeframe
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Inflow (Income)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">
            {formatCurrency(totalIncome, security.privacyMode, true)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Net cash additions & salary deposits
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Net Savings Margin</span>
            <span className="font-mono text-emerald-400 font-semibold text-xs">{savingsRate}%</span>
          </div>
          <div className="text-2xl font-mono font-bold text-slate-100 tabular-nums">
            {formatCurrency(netSavings, security.privacyMode)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Surplus saved after expenses
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Recurring Fixed Overhead</span>
            <Repeat className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-200 tabular-nums">
            {formatCurrency(monthlyRecurringSum, security.privacyMode)}
            <span className="text-xs font-normal text-slate-400">/mo</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            {activeRecurring.length} active bills & subscriptions
          </div>
        </div>
      </div>

      {/* Cash Flow Income vs Expense Chart */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Cash Flow Trajectory (Last 5 Months)</h3>
            <p className="text-xs text-slate-400">Inflow vs. Consumption comparison</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-xs bg-emerald-400" />
              <span className="text-slate-300">Inflow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-xs bg-slate-600" />
              <span className="text-slate-300">Outflow</span>
            </div>
          </div>
        </div>

        {/* Custom SVG Bar Chart */}
        <div className="h-52 w-full pt-4">
          <div className="h-40 flex items-end justify-between gap-3 sm:gap-6 border-b border-slate-800 pb-2">
            {monthlyChartData.map((d) => {
              const maxVal = 16000;
              const incHeight = Math.round((d.income / maxVal) * 100);
              const expHeight = Math.round((d.expenses / maxVal) * 100);

              return (
                <div key={d.month} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="w-full max-w-[56px] flex items-end justify-center gap-1 sm:gap-2 h-full">
                    {/* Income Bar */}
                    <div
                      style={{ height: `${incHeight}%` }}
                      className="w-full bg-emerald-400 rounded-t-sm hover:brightness-110 transition-all relative group-hover:shadow-[0_0_8px_rgba(52,211,153,0.4)]"
                      title={`${d.month} Income: $${d.income.toLocaleString()}`}
                    />
                    {/* Expenses Bar */}
                    <div
                      style={{ height: `${expHeight}%` }}
                      className="w-full bg-slate-600 rounded-t-sm hover:brightness-110 transition-all relative"
                      title={`${d.month} Outflow: $${d.expenses.toLocaleString()}`}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 mt-2">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Budgets & Spending Habits Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Category Health & Limit Settings */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Category Budget Performance</h3>
                <p className="text-xs text-slate-400">Track habits against self-enforced spending limits</p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {categoryStats.length} active categories
              </span>
            </div>

            <div className="space-y-4">
              {categoryStats.map((item) => {
                const isOver = item.percentOfBudget >= 100;
                const isNear = item.percentOfBudget >= 80 && !isOver;

                return (
                  <div
                    key={item.category}
                    className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{item.category}</span>
                        {/* Status Label (Clean unboxed text per anti-slop) */}
                        <div className="text-[11px] font-medium flex items-center gap-1">
                          {isOver ? (
                            <span className="text-rose-400 flex items-center gap-0.5">
                              <AlertCircle className="w-3 h-3" /> Over Budget
                            </span>
                          ) : isNear ? (
                            <span className="text-amber-400 flex items-center gap-0.5">
                              <AlertCircle className="w-3 h-3" /> Approaching Cap
                            </span>
                          ) : (
                            <span className="text-emerald-400 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Within Limit
                            </span>
                          )}
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-400">{item.count} purchases</span>
                        </div>
                      </div>

                      {/* Right side: Spent vs Limit */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-mono text-sm font-semibold text-white tabular-nums">
                            {formatCurrency(item.total, security.privacyMode)}
                          </span>
                          <span className="text-slate-400 text-xs font-mono">
                            {' '}/ {formatCurrency(item.limit, security.privacyMode)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartEdit(item.category, item.limit)}
                          className="p-1 rounded-md text-slate-400 hover:text-emerald-400 transition-colors"
                          title="Adjust monthly limit"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOver ? 'bg-rose-500' : isNear ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, item.percentOfBudget)}%` }}
                      />
                    </div>

                    {/* Inline edit limit drawer */}
                    {editingCategory === item.category && (
                      <div className="pt-2 flex items-center gap-2 text-xs">
                        <span className="text-slate-400">Set Monthly Cap: $</span>
                        <input
                          type="number"
                          value={editLimitVal}
                          onChange={(e) => setEditLimitVal(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono w-28 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveBudget(item.category)}
                          className="px-2.5 py-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold rounded-lg text-xs"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategory(null)}
                          className="text-slate-400 hover:text-white text-xs px-2"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Intelligent Habit Findings & Recommendations */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Spending Habit Diagnostics</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-xs space-y-1.5">
                <div className="font-semibold text-slate-200">Housing & Fixed Base</div>
                <p className="text-slate-400 leading-relaxed">
                  Housing represents <strong className="text-white">73% of monthly outlays</strong> ($3,200/mo). This is consistent with metropolitan residential leases and well within total cash inflows.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-xs space-y-1.5">
                <div className="font-semibold text-slate-200">Dining & Leisure Pacing</div>
                <p className="text-slate-400 leading-relaxed">
                  Dining is currently at <strong className="text-white">$530.65 (71% of cap)</strong>. At your current daily pace, you are on track to stay safely within your $750/mo limit.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-xs space-y-1.5">
                <div className="font-semibold text-slate-200">Cash Flow Surplus</div>
                <p className="text-slate-400 leading-relaxed">
                  October has generated <strong className="text-emerald-400">$3,497.00 in free cash flow</strong> after all living costs, which automatically accrues into your high-yield reserve at 4.85% APY.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-xs space-y-1.5">
                <div className="font-semibold text-slate-200">Zero Late Fees Recorded</div>
                <p className="text-slate-400 leading-relaxed">
                  No penalty interest, overdraft charges, or late fees recorded across any managed checking or credit lines in the past 180 days.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Recurring Bills & Subscriptions */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Repeat className="w-4 h-4 text-emerald-400" />
                  <span>Recurring Subscriptions</span>
                </h3>
                <p className="text-xs text-slate-400">Surveillance of auto-renewing commitments</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-[11px] text-slate-400">Total Committed Overhead</div>
              <div className="text-xl font-mono font-bold text-white tabular-nums mt-0.5">
                {formatCurrency(monthlyRecurringSum, security.privacyMode)}
                <span className="text-xs font-normal text-slate-400">/mo</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                {formatCurrency(annualizedRecurring, security.privacyMode)} / year projected
              </div>
            </div>

            <div className="divide-y divide-slate-800/60">
              {recurring.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                      <span>{item.merchant}</span>
                      {!item.active && (
                        <span className="text-[10px] text-amber-400 font-mono">(Paused)</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Due: {formatDate(item.nextDueDate)} · {item.frequency}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-mono font-medium tabular-nums ${
                        item.active ? 'text-white' : 'text-slate-500 line-through'
                      }`}
                    >
                      {formatCurrency(item.amount, security.privacyMode)}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleRecurringItem(item.id)}
                      className={`text-[10px] px-2 py-1 rounded transition-colors ${
                        item.active
                          ? 'bg-slate-800 text-slate-400 hover:text-white'
                          : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {item.active ? 'Pause' : 'Resume'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-800/80">
              Crestline automatically monitors merchant debits for price increases and hidden subscription creep.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
