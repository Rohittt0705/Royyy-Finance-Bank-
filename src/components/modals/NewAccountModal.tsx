import React, { useState } from 'react';
import { X, PlusCircle, CheckCircle2 } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { AccountType } from '../../types/banking';

interface NewAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewAccountModal: React.FC<NewAccountModalProps> = ({ isOpen, onClose }) => {
  const { createAccount } = useBanking();
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<AccountType>('savings');
  const [initialDeposit, setInitialDeposit] = useState<string>('5000.00');
  const [currency] = useState<string>('USD');
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const depositNum = parseFloat(initialDeposit) || 0;
    const randomAccNum = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    const newAccData = {
      name: name.trim(),
      type,
      accountNumber: randomAccNum,
      routingNumber: '021000021',
      balance: type === 'credit' ? 0 : depositNum,
      availableBalance: type === 'credit' ? 25000 : depositNum,
      currency,
      apy: type === 'savings' ? 4.85 : type === 'investment' ? 2.5 : undefined,
      creditLimit: type === 'credit' ? 25000 : undefined,
      isFrozen: false,
      colorTheme: (type === 'checking' ? 'slate' : type === 'savings' ? 'emerald' : type === 'investment' ? 'indigo' : 'zinc') as any,
      cardDetails: type === 'checking' || type === 'credit' ? {
        cardNumber: `4${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
        cardholderName: 'ALEXANDER M. VANCE',
        expiryDate: '10/31',
        cvv: Math.floor(100 + Math.random() * 900).toString(),
        isFrozen: false,
        contactlessEnabled: true,
        internationalEnabled: true,
        dailyAtmLimit: 1500,
        dailyOnlineLimit: 5000,
        pin: '1234',
      } : undefined,
    };

    createAccount(newAccData);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
      setName('');
      setInitialDeposit('5000.00');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Open New Account</h3>
              <p className="text-xs text-slate-400">Establish a new segregated checking, savings, or wealth vault</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close new account modal"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success && (
            <div className="p-3 rounded-xl text-xs flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/80 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>New account opened and capitalized successfully!</span>
            </div>
          )}

          {/* Account Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Account Classification</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'checking', label: 'Checking', desc: 'Debit card & daily ops' },
                { id: 'savings', label: 'High-Yield Savings', desc: '4.85% APY yield' },
                { id: 'investment', label: 'Treasury Vault', desc: 'Long-term reserve' },
                { id: 'credit', label: 'Revolving Credit', desc: '$25,000 credit limit' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => {
                    setType(opt.id as AccountType);
                    if (!name) {
                      setName(opt.id === 'savings' ? 'Apex High-Yield Vault' : opt.id === 'checking' ? 'Operations Checking' : opt.id === 'investment' ? 'Treasury Reserve Vault' : 'Diamond Rewards Card');
                    }
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    type === opt.id
                      ? 'bg-emerald-950/40 border-emerald-500/80 text-white shadow-sm'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-semibold">{opt.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Account Nickname */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Account Nickname</label>
            <input
              type="text"
              required
              placeholder="e.g. Emergency Liquidity Reserve, Tax Vault"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Initial Opening Deposit */}
          {type !== 'credit' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Initial Opening Capitalization (USD)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="5000.00"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-base font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 tabular-nums"
                />
              </div>
            </div>
          )}

          {/* Regulatory & FDIC note */}
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            All accounts opened under Crestline Premier are FDIC insured up to $250,000 per depositor. Routing transit #021000021.
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
              disabled={!name.trim()}
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md"
            >
              Establish Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
