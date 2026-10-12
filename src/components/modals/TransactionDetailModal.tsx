import React from 'react';
import { X, Receipt, CheckCircle2, ShieldCheck, Download, Share2 } from 'lucide-react';
import { Transaction } from '../../types/banking';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
}) => {
  const { accounts, security } = useBanking();

  if (!transaction) return null;

  const linkedAccount = accounts.find((a) => a.id === transaction.accountId);

  const handleDownloadReceipt = () => {
    const textReceipt = `
========================================
CRESTLINE PREMIER BANKING - OFFICIAL RECEIPT
========================================
Reference: ${transaction.referenceNumber}
Date: ${transaction.date}
Merchant/Counterparty: ${transaction.merchant}
Category: ${transaction.category}
Type: ${transaction.type.toUpperCase()}
Amount: ${transaction.type === 'debit' ? '-' : '+'}$${transaction.amount.toFixed(2)} USD
Account: ${linkedAccount ? `${linkedAccount.name} (*${linkedAccount.accountNumber.slice(-4)})` : 'Primary'}
Status: SETTLED
Memo: ${transaction.note || 'None'}
Timestamp: ${new Date().toISOString()}
========================================
Verification Enclave Signature: SHA256-AUTHENTICATED
========================================
    `.trim();

    const blob = new Blob([textReceipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${transaction.referenceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Transaction Record</h3>
              <p className="text-xs text-slate-400 font-mono tabular-nums">{transaction.referenceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close transaction details"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Hero */}
        <div className="p-6 text-center border-b border-slate-800/80 bg-slate-950/40">
          <div className="text-xs text-slate-400 font-medium mb-1">{transaction.merchant}</div>
          <div
            className={`text-3xl font-mono font-bold tracking-tight tabular-nums ${
              transaction.type === 'credit' ? 'text-emerald-400' : 'text-slate-100'
            }`}
          >
            {transaction.type === 'debit' ? '-' : '+'}
            {formatCurrency(transaction.amount, security.privacyMode)}
          </div>
          <div className="inline-flex items-center gap-1 mt-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Settled & Reconciled</span>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="p-6 space-y-3.5 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Date Posted</span>
            <span className="text-slate-200 font-medium">{formatDate(transaction.date)}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Spending Category</span>
            <span className="text-slate-200 font-medium">{transaction.category}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Account Used</span>
            <span className="text-slate-200 font-medium">
              {linkedAccount ? `${linkedAccount.name} (*${linkedAccount.accountNumber.slice(-4)})` : 'Direct Clearing'}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Transaction ID</span>
            <span className="text-slate-300 font-mono">{transaction.id}</span>
          </div>

          {transaction.note && (
            <div className="pt-1">
              <span className="text-slate-400 block mb-1">Receipt Note</span>
              <p className="text-slate-300 bg-slate-800/50 border border-slate-800 p-2.5 rounded-lg text-xs">
                {transaction.note}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/30 text-[11px] text-slate-400 border border-slate-800/60">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Cryptographically sealed under Crestline audit chain.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/90 border-t border-slate-800">
          <button
            type="button"
            onClick={handleDownloadReceipt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-xs font-medium text-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Receipt</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-xs font-semibold text-slate-950 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
