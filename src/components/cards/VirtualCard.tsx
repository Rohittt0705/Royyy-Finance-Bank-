import React, { useState } from 'react';
import {
  CreditCard,
  Wifi,
  Copy,
  Check,
  Eye,
  EyeOff,
  Snowflake,
  Globe,
  Sliders,
  Shield,
} from 'lucide-react';
import { Account } from '../../types/banking';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/formatters';

interface VirtualCardProps {
  account: Account;
}

export const VirtualCard: React.FC<VirtualCardProps> = ({ account }) => {
  const { toggleCardFreeze, updateCardSettings, security } = useBanking();
  const [showFullNumber, setShowFullNumber] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showLimitsDrawer, setShowLimitsDrawer] = useState<boolean>(false);

  const card = account.cardDetails;
  if (!card) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center bg-slate-900/40">
        <CreditCard className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h4 className="text-sm font-semibold text-slate-300">No Payment Card Linked</h4>
        <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
          This account functions as a direct settlement deposit vault without a physical debit card.
        </p>
      </div>
    );
  }

  const handleCopyCard = () => {
    navigator.clipboard.writeText(card.cardNumber.replace(/\s+/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isFrozen = card.isFrozen || account.isFrozen;

  return (
    <div className="space-y-4">
      {/* Visual Card Canvas */}
      <div className="relative group perspective">
        <div
          className={`relative aspect-[1.586/1] max-w-sm sm:max-w-md w-full mx-auto rounded-2xl p-6 sm:p-7 shadow-2xl overflow-hidden transition-all duration-300 border ${
            isFrozen
              ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-sky-900/50'
              : account.type === 'credit'
              ? 'bg-gradient-to-br from-zinc-900 via-neutral-900 to-black border-zinc-700/60 shadow-black/80'
              : account.type === 'savings'
              ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border-emerald-800/40'
              : 'bg-gradient-to-br from-slate-900 via-slate-950 to-zinc-950 border-slate-700/60'
          }`}
        >
          {/* Subtle noise/mesh background lines */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(255,255,255,0.08),transparent_50%)] pointer-events-none" />
          <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />

          {/* Frozen Watermark Overlay */}
          {isFrozen && (
            <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-sky-950/80 border border-sky-800/60 flex items-center justify-center text-sky-400 mb-2">
                <Snowflake className="w-6 h-6 animate-pulse" />
              </div>
              <span className="text-xs font-bold tracking-wider text-sky-300 uppercase">Card Temporarily Frozen</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Authorizations and contactless tap disabled</span>
              <button
                type="button"
                onClick={() => toggleCardFreeze(account.id)}
                className="mt-3 px-3 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg text-xs font-medium transition-colors"
              >
                Unfreeze Card
              </button>
            </div>
          )}

          {/* Card Top Row */}
          <div className="flex items-center justify-between mb-8 sm:mb-10">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold tracking-tight text-white">
                CRESTLINE
              </span>
              <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase">
                {account.type === 'credit' ? 'Black Diamond' : 'Premier Debit'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-slate-400">
              {card.contactlessEnabled && <Wifi className="w-4 h-4 rotate-90 text-slate-300" />}
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                {account.type === 'credit' ? 'World Elite' : 'Debit'}
              </span>
            </div>
          </div>

          {/* EMV Microchip */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-7 rounded-sm bg-gradient-to-tr from-amber-300 via-amber-400 to-amber-200 border border-amber-500/60 flex items-center justify-around px-1 shadow-sm opacity-90">
              <div className="w-2.5 h-full border-r border-amber-600/40" />
              <div className="w-2.5 h-full border-r border-amber-600/40" />
            </div>
          </div>

          {/* Card Number */}
          <div className="mb-6 flex items-center justify-between">
            <div className="font-mono text-base sm:text-lg tracking-[0.2em] text-slate-100 select-all font-medium tabular-nums">
              {showFullNumber ? card.cardNumber : `•••• •••• •••• ${card.cardNumber.slice(-4)}`}
            </div>
            <button
              type="button"
              onClick={handleCopyCard}
              title="Copy card number"
              className="p-1.5 text-slate-400 hover:text-white rounded transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Cardholder, Expiry, CVV */}
          <div className="flex items-end justify-between text-slate-300">
            <div>
              <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">Cardholder</div>
              <div className="text-xs sm:text-sm font-medium tracking-wide uppercase text-white font-sans">
                {card.cardholderName}
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">Expires</div>
                <div className="text-xs sm:text-sm font-mono text-slate-200 tabular-nums">
                  {card.expiryDate}
                </div>
              </div>

              <div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">CVV</div>
                <div className="text-xs sm:text-sm font-mono text-slate-200 tabular-nums">
                  {showFullNumber ? card.cvv : '•••'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Quick Controls Toolbar */}
      <div className="max-w-sm sm:max-w-md mx-auto grid grid-cols-3 gap-2 text-xs">
        {/* Toggle Reveal Details */}
        <button
          type="button"
          onClick={() => setShowFullNumber((prev) => !prev)}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          {showFullNumber ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
          <span>{showFullNumber ? 'Veil Details' : 'Show CVV'}</span>
        </button>

        {/* Freeze Switch */}
        <button
          type="button"
          onClick={() => toggleCardFreeze(account.id)}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border transition-colors ${
            isFrozen
              ? 'bg-sky-950/60 border-sky-800 text-sky-300 hover:bg-sky-900/60'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <Snowflake className={`w-3.5 h-3.5 ${isFrozen ? 'text-sky-400 animate-spin' : 'text-slate-400'}`} />
          <span>{isFrozen ? 'Unfreeze' : 'Freeze Card'}</span>
        </button>

        {/* Limits Drawer Trigger */}
        <button
          type="button"
          onClick={() => setShowLimitsDrawer((prev) => !prev)}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span>Limits</span>
        </button>
      </div>

      {/* Expanded Security & Spending Limits Drawer */}
      {showLimitsDrawer && (
        <div className="max-w-sm sm:max-w-md mx-auto p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Card Security Controls
            </span>
            <button
              onClick={() => setShowLimitsDrawer(false)}
              className="text-[11px] text-slate-400 hover:text-slate-200"
            >
              Close
            </button>
          </div>

          {/* Contactless toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-200">NFC Contactless Tap</div>
              <div className="text-[11px] text-slate-500">Enable physical point-of-sale tap</div>
            </div>
            <button
              type="button"
              onClick={() => updateCardSettings(account.id, { contactlessEnabled: !card.contactlessEnabled })}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                card.contactlessEnabled ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  card.contactlessEnabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* International toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-200 flex items-center gap-1">
                <Globe className="w-3 h-3 text-slate-400" />
                International Transactions
              </div>
              <div className="text-[11px] text-slate-500">Foreign currency & overseas merchants</div>
            </div>
            <button
              type="button"
              onClick={() => updateCardSettings(account.id, { internationalEnabled: !card.internationalEnabled })}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                card.internationalEnabled ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  card.internationalEnabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Daily Online Limit Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Daily Online Purchase Cap</span>
              <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                {formatCurrency(card.dailyOnlineLimit, security.privacyMode)}
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="20000"
              step="500"
              value={card.dailyOnlineLimit}
              onChange={(e) => updateCardSettings(account.id, { dailyOnlineLimit: parseInt(e.target.value, 10) })}
              className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
          </div>

          {/* Daily ATM Limit Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Daily ATM Cash Withdrawal</span>
              <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                {formatCurrency(card.dailyAtmLimit, security.privacyMode)}
              </span>
            </div>
            <input
              type="range"
              min="200"
              max="5000"
              step="100"
              value={card.dailyAtmLimit}
              onChange={(e) => updateCardSettings(account.id, { dailyAtmLimit: parseInt(e.target.value, 10) })}
              className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
          </div>
        </div>
      )}
    </div>
  );
};
