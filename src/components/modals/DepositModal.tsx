import React, { useState } from 'react';
import { X, ArrowDownCircle, CheckCircle2, AlertCircle, Camera } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAccountId?: string;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, defaultAccountId }) => {
  const { accounts, depositFunds } = useBanking();
  const [targetAccountId, setTargetAccountId] = useState<string>(
    defaultAccountId || accounts[0]?.id || ''
  );
  const [amountStr, setAmountStr] = useState<string>('');
  const [sourceDescription, setSourceDescription] = useState<string>('Payroll / Consulting Wire');
  const [checkFrontCaptured, setCheckFrontCaptured] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      setStatusMessage({ type: 'error', text: 'Enter a valid deposit amount greater than $0.00' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    setTimeout(() => {
      const res = depositFunds(targetAccountId, amount, sourceDescription);
      setIsSubmitting(false);
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
        setAmountStr('');
        setTimeout(() => {
          onClose();
          setStatusMessage(null);
        }, 1200);
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <ArrowDownCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Deposit Funds</h3>
              <p className="text-xs text-slate-400">Mobile check capture simulation & incoming wires</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close deposit modal"
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

          {/* Account Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Deposit Into</label>
            <select
              value={targetAccountId}
              onChange={(e) => setTargetAccountId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Check / Wire Amount</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="1500.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-base font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 tabular-nums"
              />
            </div>
          </div>

          {/* Source / Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Check Payer or Wire Description</label>
            <input
              type="text"
              value={sourceDescription}
              onChange={(e) => setSourceDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Simulated Mobile Check Capture */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
            <div className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>Simulated Check Image Verification</span>
              <span className="text-[10px] text-emerald-400 font-mono">MICR OCR Active</span>
            </div>
            <button
              type="button"
              onClick={() => setCheckFrontCaptured(!checkFrontCaptured)}
              className={`w-full py-2.5 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                checkFrontCaptured
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-300'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{checkFrontCaptured ? 'Front & Back Check Endorsed (Verified)' : 'Click to Simulate Check Scan'}</span>
            </button>
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
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md"
            >
              {isSubmitting ? 'Verifying Deposit...' : 'Authorize Deposit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
