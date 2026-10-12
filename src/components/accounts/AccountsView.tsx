import React, { useState } from 'react';
import {
  Wallet,
  CreditCard,
  Plus,
  ArrowRight,
  ArrowDownLeft,
  Copy,
  Check,
  Shield,
  FileText,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { VirtualCard } from '../cards/VirtualCard';
import { Transaction } from '../../types/banking';
import { exportTransactionsCSV, openPrintablePDFStatement } from '../../utils/exportStatement';
import { ExportStatementModal } from '../modals/ExportStatementModal';

interface AccountsViewProps {
  onOpenTransferModal: () => void;
  onOpenDepositModal: () => void;
  onOpenNewAccountModal: () => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  onOpenTransferModal,
  onOpenDepositModal,
  onOpenNewAccountModal,
  onSelectTransaction,
}) => {
  const {
    accounts,
    activeAccountId,
    setActiveAccountId,
    activeAccount,
    transactions,
    security,
    exportDataJson,
  } = useBanking();

  const [copiedRouting, setCopiedRouting] = useState<boolean>(false);
  const [copiedAccountNum, setCopiedAccountNum] = useState<boolean>(false);
  const [revealAccountNum, setRevealAccountNum] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  const account = activeAccount || accounts[0];

  const handleCopyRouting = () => {
    if (account) {
      navigator.clipboard.writeText(account.routingNumber);
      setCopiedRouting(true);
      setTimeout(() => setCopiedRouting(false), 2000);
    }
  };

  const handleCopyAccountNum = () => {
    if (account) {
      navigator.clipboard.writeText(account.accountNumber);
      setCopiedAccountNum(true);
      setTimeout(() => setCopiedAccountNum(false), 2000);
    }
  };

  // Transactions specific to this account
  const accountTransactions = transactions.filter((t) => t.accountId === account?.id);

  return (
    <div className="space-y-8">
      {/* Header & Account Selection Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Accounts & Card Portfolios</h1>
          <p className="text-xs text-slate-400">
            Segregated deposit accounts, high-yield vaults, and smart virtual card controls
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewAccountModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs transition-colors self-start md:self-auto shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Open New Account</span>
        </button>
      </div>

      {/* Segmented Account Bar */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
        {accounts.map((acc) => (
          <button
            key={acc.id}
            type="button"
            onClick={() => {
              setActiveAccountId(acc.id);
              setRevealAccountNum(false);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
              acc.id === activeAccountId
                ? 'bg-emerald-400 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {acc.name}
          </button>
        ))}
      </div>

      {/* Main Account Details & Virtual Card Split */}
      {account && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Account Details & Bank Routing Info */}
          <div className="lg:col-span-7 space-y-6">
            {/* Account Card Banner */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                    {account.type.toUpperCase()} ACCOUNT
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">{account.name}</h2>
                </div>
                {account.isFrozen && (
                  <div className="flex items-center gap-1 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/60 px-2.5 py-1 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Frozen</span>
                  </div>
                )}
              </div>

              {/* Balance Showcase */}
              <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {account.type === 'credit' ? 'Current Outstanding Balance' : 'Current Settled Balance'}
                  </span>
                  {account.apy && (
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      Compounding at {account.apy}% APY
                    </span>
                  )}
                </div>
                <div className="text-3xl font-mono font-bold text-white tracking-tight mt-1 tabular-nums">
                  {formatCurrency(account.balance, security.privacyMode)}
                </div>

                {account.type === 'credit' && account.creditLimit && (
                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Available Credit Line</span>
                      <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                        {formatCurrency(account.availableBalance, security.privacyMode)} / {formatCurrency(account.creditLimit, security.privacyMode)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${Math.round((account.balance / account.creditLimit) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Wire & Routing Numbers Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Routing Transit */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">Routing (Fedwire / ACH)</div>
                  <div className="flex items-center justify-between font-mono text-sm text-slate-200 tabular-nums">
                    <span>{account.routingNumber}</span>
                    <button
                      type="button"
                      onClick={handleCopyRouting}
                      title="Copy routing number"
                      className="p-1 hover:text-emerald-400 text-slate-400 transition-colors"
                    >
                      {copiedRouting ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Account Number */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Account Transit Number</span>
                    <button
                      type="button"
                      onClick={() => setRevealAccountNum(!revealAccountNum)}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      {revealAccountNum ? 'Hide' : 'Reveal'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between font-mono text-sm text-slate-200 tabular-nums">
                    <span>{revealAccountNum ? account.accountNumber : `•••• ${account.accountNumber.slice(-4)}`}</span>
                    <button
                      type="button"
                      onClick={handleCopyAccountNum}
                      title="Copy full account number"
                      className="p-1 hover:text-emerald-400 text-slate-400 transition-colors"
                    >
                      {copiedAccountNum ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Account Quick Action Bar */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onOpenTransferModal}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Transfer In / Out</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenDepositModal}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Deposit Funds</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                  title="Export transaction history as CSV or PDF statement"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export Statement</span>
                </button>
              </div>
            </div>

            {/* Account Specific Transactions */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Activity for {account.name}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {accountTransactions.length} recorded events
                  </span>
                </div>

                {/* Direct Export History buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => exportTransactionsCSV(account, accountTransactions)}
                    title="Download account transaction history as CSV spreadsheet"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openPrintablePDFStatement(account, accountTransactions)}
                    title="Generate official printable PDF bank statement"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExportModalOpen(true)}
                    title="Filter date range and export options"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-800/60">
                {accountTransactions.slice(0, 8).map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx)}
                    className="py-3 flex items-center justify-between hover:bg-slate-800/40 p-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-xs font-medium text-slate-200">{tx.merchant}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {formatDate(tx.date)} · {tx.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-xs font-mono font-medium tabular-nums ${
                          tx.type === 'credit' ? 'text-emerald-400' : 'text-slate-100'
                        }`}
                      >
                        {tx.type === 'debit' ? '-' : '+'}
                        {formatCurrency(tx.amount, security.privacyMode)}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono">Settled</div>
                    </div>
                  </div>
                ))}

                {accountTransactions.length === 0 && (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No transactions recorded for this specific account yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Virtual Card Interface */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Encrypted Virtual Card</span>
              </h3>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" />
                PCI-DSS Level 1
              </span>
            </div>

            <VirtualCard account={account} />
          </div>
        </div>
      )}

      {/* Export Statement Modal */}
      {account && (
        <ExportStatementModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          accounts={accounts}
          activeAccount={account}
          transactions={transactions}
          privacyMode={security.privacyMode}
        />
      )}
    </div>
  );
};
