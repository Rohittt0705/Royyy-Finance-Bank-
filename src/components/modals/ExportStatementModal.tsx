import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { Account, Transaction } from '../../types/banking';
import { exportTransactionsCSV, openPrintablePDFStatement } from '../../utils/exportStatement';
import { formatCurrency } from '../../utils/formatters';

interface ExportStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  activeAccount: Account;
  transactions: Transaction[];
  privacyMode: boolean;
}

export const ExportStatementModal: React.FC<ExportStatementModalProps> = ({
  isOpen,
  onClose,
  accounts,
  activeAccount,
  transactions,
  privacyMode,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(activeAccount.id);
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'pdf'>('csv');
  const [dateRange, setDateRange] = useState<'all' | 'oct-2026' | 'sep-2026' | 'last-90'>('all');
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentAccount = accounts.find((a) => a.id === selectedAccountId) || activeAccount;

  // Filter transactions by account and date range
  const filteredTxs = transactions.filter((t) => {
    if (t.accountId !== currentAccount.id) return false;
    if (dateRange === 'oct-2026') return t.date.startsWith('2026-10');
    if (dateRange === 'sep-2026') return t.date.startsWith('2026-09');
    if (dateRange === 'last-90') return t.date >= '2026-08-01';
    return true;
  });

  const handleExport = () => {
    const rangeLabel =
      dateRange === 'oct-2026'
        ? 'October 1, 2026 – October 31, 2026'
        : dateRange === 'sep-2026'
        ? 'September 1, 2026 – September 30, 2026'
        : dateRange === 'last-90'
        ? 'August 1, 2026 – October 31, 2026'
        : 'All Inception History to Date';

    if (selectedFormat === 'csv') {
      exportTransactionsCSV(currentAccount, filteredTxs);
      setExportSuccess(`CSV file successfully generated for ${currentAccount.name}`);
    } else {
      openPrintablePDFStatement(currentAccount, filteredTxs, rangeLabel);
      setExportSuccess(`PDF statement opened in print view for ${currentAccount.name}`);
    }

    setTimeout(() => {
      setExportSuccess(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Export Transaction History</h3>
              <p className="text-xs text-slate-400">Official CSV spreadsheet or printable PDF bank statement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close export modal"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {exportSuccess && (
            <div className="p-3.5 rounded-xl text-xs flex items-center gap-2 bg-emerald-950/60 border border-emerald-800 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{exportSuccess}</span>
            </div>
          )}

          {/* Account Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Select Account</label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} — Bal: {formatCurrency(acc.balance, privacyMode)} (•••• {acc.accountNumber.slice(-4)})
                </option>
              ))}
            </select>
          </div>

          {/* Export Format Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Export Format</label>
            <div className="grid grid-cols-2 gap-3">
              {/* CSV Option */}
              <button
                type="button"
                onClick={() => setSelectedFormat('csv')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedFormat === 'csv'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileSpreadsheet className={`w-4 h-4 ${selectedFormat === 'csv' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-semibold">CSV Spreadsheet</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Excel, Google Sheets, QuickBooks, or personal accounting software.
                </p>
              </button>

              {/* PDF Option */}
              <button
                type="button"
                onClick={() => setSelectedFormat('pdf')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedFormat === 'pdf'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText className={`w-4 h-4 ${selectedFormat === 'pdf' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-semibold">Official PDF Statement</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Print-ready bank letterhead, FDIC notice, and reconciled balances.
                </p>
              </button>
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Statement Period</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'all', label: 'All History' },
                { id: 'oct-2026', label: 'Oct 2026' },
                { id: 'sep-2026', label: 'Sep 2026' },
                { id: 'last-90', label: 'Last 90 Days' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDateRange(item.id as any)}
                  className={`py-2 px-2 text-center rounded-lg text-xs font-medium transition-colors ${
                    dateRange === item.id
                      ? 'bg-emerald-400 text-slate-950 font-semibold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Record Count */}
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs flex items-center justify-between">
            <span className="text-slate-400">Records matching criteria:</span>
            <span className="font-mono font-semibold text-emerald-400">
              {filteredTxs.length} transactions
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Cryptographic audit header included for official reconciliation.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="px-5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md"
          >
            {selectedFormat === 'csv' ? (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Download CSV File</span>
              </>
            ) : (
              <>
                <Printer className="w-3.5 h-3.5" />
                <span>Generate PDF Statement</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
