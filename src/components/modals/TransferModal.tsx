import React, { useState } from 'react';
import { X, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSourceId?: string;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  defaultSourceId,
}) => {
  const { accounts, transferFunds, security } = useBanking();

  const [fromAccountId, setFromAccountId] = useState<string>(
    defaultSourceId || accounts[0]?.id || ''
  );
  const [toAccountId, setToAccountId] = useState<string>(
    accounts.find((a) => a.id !== (defaultSourceId || accounts[0]?.id))?.id || accounts[1]?.id || ''
  );
  const [amountStr, setAmountStr] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const sourceAccount = accounts.find((a) => a.id === fromAccountId);
  const destAccount = accounts.find((a) => a.id === toAccountId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid amount greater than $0.00' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    setTimeout(() => {
      const res = transferFunds(fromAccountId, toAccountId, amount, memo);
      setIsSubmitting(false);
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
        setAmountStr('');
        setMemo('');
        setTimeout(() => {
          onClose();
          setStatusMessage(null);
        }, 1200);
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    }, 350);
  };

  const handleMaxAmount = () => {
    if (sourceAccount) {
      setAmountStr(sourceAccount.availableBalance.toFixed(2));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <ArrowRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Transfer Funds</h3>
              <p className="text-xs text-slate-400">Instant zero-fee internal liquidity reallocation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close transfer modal"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-800/80 text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* From Account */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">From Account</label>
            <select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} disabled={acc.isFrozen}>
                  {acc.name} — Avail: {formatCurrency(acc.availableBalance, security.privacyMode)} {acc.isFrozen ? '(FROZEN)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* To Account */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">To Account</label>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              {accounts
                .filter((acc) => acc.id !== fromAccountId)
                .map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — Bal: {formatCurrency(acc.balance, security.privacyMode)}
                  </option>
                ))}
            </select>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">Amount (USD)</label>
              {sourceAccount && (
                <button
                  type="button"
                  onClick={handleMaxAmount}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  Use Max Available ({formatCurrency(sourceAccount.availableBalance, security.privacyMode)})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-base font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 tabular-nums"
              />
            </div>
          </div>

          {/* Optional Memo */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Transfer Memo (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Savings allocation, Rent coverage"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Settlement Speed Notice */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Instant real-time settlement within Crestline internal ledger. Zero fee.</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amountStr || parseFloat(amountStr) <= 0}
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              {isSubmitting ? 'Authorizing Transfer...' : 'Confirm Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
