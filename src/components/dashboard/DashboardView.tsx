import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  Search,
  Plus,
  Shield,
  CreditCard,
  Building,
  TrendingUp,
  PieChart,
  Filter,
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Transaction, TransactionCategory } from '../../types/banking';
import { NavTab } from '../layout/Navbar';

interface DashboardViewProps {
  onNavigateTab: (tab: NavTab) => void;
  onOpenTransferModal: () => void;
  onOpenDepositModal: () => void;
  onOpenNewAccountModal: () => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenTransferModal,
  onOpenDepositModal,
  onOpenNewAccountModal,
  onSelectTransaction,
}) => {
  const {
    accounts,
    transactions,
    budgets,
    totalNetWorth,
    totalLiquidCash,
    activeAccountId,
    setActiveAccountId,
    security,
  } = useBanking();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Calculate monthly spending metrics (e.g., current month October 2026)
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith('2026-10'));
  }, [transactions]);

  const monthExpenses = useMemo(() => {
    return currentMonthTransactions
      .filter((t) => t.type === 'debit' && t.category !== 'Transfer')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTransactions]);

  const monthIncome = useMemo(() => {
    return currentMonthTransactions
      .filter((t) => t.type === 'credit' && t.category !== 'Transfer')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTransactions]);

  const totalMonthlyBudget = useMemo(() => {
    return budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  }, [budgets]);

  const budgetProgressPercent = Math.min(100, Math.round((monthExpenses / (totalMonthlyBudget || 1)) * 100));

  // Top spending categories this month
  const categorySpendMap = useMemo(() => {
    const map: Record<string, number> = {};
    currentMonthTransactions
      .filter((t) => t.type === 'debit' && t.category !== 'Transfer')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map)
      .map(([cat, amount]) => ({ category: cat, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [currentMonthTransactions]);

  // Filtered transactions for the ledger
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || tx.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [transactions, searchQuery, selectedCategory]);

  return (
    <div className="space-y-8">
      {/* Top Banner: Financial Overview & Net Liquidity */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Total Net Worth Card */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Total Consolidated Net Worth
              </span>
              <span className="text-emerald-400 font-mono tabular-nums">+4.2% this month</span>
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-bold text-white tracking-tight mt-2 tabular-nums">
              {formatCurrency(totalNetWorth, security.privacyMode)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-800/80">
            <div>
              <span className="text-[11px] text-slate-400 block">Available Liquid Cash</span>
              <span className="text-base font-mono font-semibold text-emerald-400 tabular-nums">
                {formatCurrency(totalLiquidCash, security.privacyMode)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Current Debt / Liabilities</span>
              <span className="text-base font-mono font-semibold text-slate-300 tabular-nums">
                {formatCurrency(2380.50, security.privacyMode)}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Cash Flow Inflow */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">October Inflow</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">
              {formatCurrency(monthIncome, security.privacyMode, true)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">2 payroll & advisory deposits</div>
          </div>
          <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-800/60">
            FDIC Insured Treasury Clearing
          </div>
        </div>

        {/* Monthly Outflow & Budget Burn */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">October Outflow</span>
            <div className="w-7 h-7 rounded-lg bg-rose-950 border border-rose-800/60 flex items-center justify-center text-rose-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-mono font-bold text-slate-100 tabular-nums">
              {formatCurrency(monthExpenses, security.privacyMode)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {budgetProgressPercent}% of total monthly budget cap
            </div>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                budgetProgressPercent > 90 ? 'bg-rose-500' : 'bg-emerald-400'
              }`}
              style={{ width: `${budgetProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Action Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
          <span>Quick Banking Actions:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenTransferModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Transfer Funds</span>
          </button>
          <button
            type="button"
            onClick={onOpenDepositModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Deposit Check</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('transfers')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>Send Fedwire</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewAccountModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-slate-400" />
            <span>Open Account</span>
          </button>
        </div>
      </div>

      {/* Accounts Portfolio Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Your Managed Accounts</span>
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab('accounts')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors flex items-center gap-1"
          >
            <span>Manage All Accounts & Cards</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map((acc) => {
            const isSelected = acc.id === activeAccountId;
            return (
              <div
                key={acc.id}
                onClick={() => setActiveAccountId(acc.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    {acc.type === 'credit' ? 'Revolving Credit' : acc.type}
                  </span>
                  {acc.apy && (
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                      {acc.apy}% APY
                    </span>
                  )}
                  {acc.type === 'credit' && (
                    <span className="text-[11px] font-mono text-zinc-400">Limit: $35k</span>
                  )}
                </div>

                <div className="text-sm font-semibold text-white truncate mb-1">{acc.name}</div>
                <div className="text-xs text-slate-400 font-mono mb-4">
                  •••• {acc.accountNumber.slice(-4)}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      {acc.type === 'credit' ? 'Balance Owed' : 'Balance'}
                    </span>
                    <span className="text-base font-mono font-bold text-white tabular-nums">
                      {formatCurrency(acc.balance, security.privacyMode)}
                    </span>
                  </div>
                  {acc.cardDetails && (
                    <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spending Habits Quick Snapshot & Top Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Habit Insights Box */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Spending Habit Velocity</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('analytics')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
              >
                Deep Analysis
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Your spending is tracking <strong className="text-emerald-300">12% lower</strong> than September. Primary expenditures are driven by housing and dining.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">October Total Spent</span>
                <span className="font-mono text-white font-medium tabular-nums">
                  {formatCurrency(monthExpenses, security.privacyMode)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Allocated Budget Cap</span>
                <span className="font-mono text-slate-300 tabular-nums">
                  {formatCurrency(totalMonthlyBudget, security.privacyMode)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Calculated Savings Margin</span>
                <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                  {formatCurrency(Math.max(0, monthIncome - monthExpenses), security.privacyMode)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
            Automated categorizations refreshed in real-time.
          </div>
        </div>

        {/* Top Spending Categories Bars */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <span>Top Spending Outflows (Current Cycle)</span>
            </h3>
            <span className="text-xs text-slate-400">Total: {categorySpendMap.length} categories</span>
          </div>

          <div className="space-y-3.5">
            {categorySpendMap.slice(0, 4).map((cat) => {
              const percent = monthExpenses > 0 ? Math.round((cat.amount / monthExpenses) * 100) : 0;
              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{cat.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-mono text-[11px]">{percent}%</span>
                      <span className="font-mono text-slate-100 font-semibold tabular-nums">
                        {formatCurrency(cat.amount, security.privacyMode)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity Ledger */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white">Recent Transactions</h3>
            <p className="text-xs text-slate-400">Real-time audited transaction ledger across all accounts</p>
          </div>

          {/* Search & Category Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search merchant, ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Housing">Housing</option>
                <option value="Groceries">Groceries</option>
                <option value="Dining">Dining</option>
                <option value="Transport">Transport</option>
                <option value="Subscriptions">Subscriptions</option>
                <option value="Utilities">Utilities</option>
                <option value="Shopping">Shopping</option>
                <option value="Health">Health</option>
                <option value="Income">Income</option>
                <option value="Transfer">Transfer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table / List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="py-3 px-3 font-medium">Merchant / Counterparty</th>
                <th className="py-3 px-3 font-medium">Category</th>
                <th className="py-3 px-3 font-medium">Account</th>
                <th className="py-3 px-3 font-medium">Date</th>
                <th className="py-3 px-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.slice(0, 8).map((tx) => {
                const acc = accounts.find((a) => a.id === tx.accountId);
                return (
                  <tr
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-200 group-hover:text-emerald-300 transition-colors">
                        {tx.merchant}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{tx.referenceNumber}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {tx.category}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {acc ? `${acc.name.split(' ')[0]} (*${acc.accountNumber.slice(-4)})` : 'Primary'}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {formatDate(tx.date)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`font-mono font-medium tabular-nums ${
                          tx.type === 'credit' ? 'text-emerald-400' : 'text-slate-100'
                        }`}
                      >
                        {tx.type === 'debit' ? '-' : '+'}
                        {formatCurrency(tx.amount, security.privacyMode)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-10 text-xs text-slate-500">
              No transactions matching "{searchQuery}".
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => onNavigateTab('analytics')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
          >
            <span>View Complete Transaction & Spending History</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
