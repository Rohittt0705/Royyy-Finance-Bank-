import React from 'react';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';

export type NavTab = 'dashboard' | 'accounts' | 'analytics' | 'transfers' | 'security';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenTransferModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange, onOpenTransferModal }) => {
  const { security, togglePrivacyMode, lockSession } = useBanking();

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onTabChange('dashboard')}
          className="text-left font-bold tracking-tight text-lg sm:text-xl text-slate-100 whitespace-nowrap shrink-0 hover:text-emerald-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
        >
          Crestline Premier
        </button>

        {/* Zone 2: 4-5 clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              currentTab === 'dashboard'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onTabChange('accounts')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              currentTab === 'accounts'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            Accounts & Cards
          </button>
          <button
            onClick={() => onTabChange('analytics')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              currentTab === 'analytics'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            Spending Habits
          </button>
          <button
            onClick={() => onTabChange('transfers')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              currentTab === 'transfers'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            Transfers & Pay
          </button>
          <button
            onClick={() => onTabChange('security')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              currentTab === 'security'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            Security & Vault
          </button>
        </nav>

        {/* Zone 3: Security & Quick Action zone */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Privacy veil toggle */}
          <button
            onClick={togglePrivacyMode}
            title={security.privacyMode ? 'Reveal private financial figures' : 'Veil figures for privacy'}
            aria-label={security.privacyMode ? 'Reveal private financial figures' : 'Veil figures for privacy'}
            className={`p-2 rounded-lg text-xs font-medium transition-colors border ${
              security.privacyMode
                ? 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/40'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
          >
            {security.privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Quick Transfer Primary Action */}
          <button
            onClick={onOpenTransferModal}
            className="hidden sm:inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-medium text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors rounded-lg whitespace-nowrap shrink-0 font-sans"
          >
            Move Money
          </button>

          {/* Instant Lock Session */}
          <button
            onClick={lockSession}
            title="Lock active banking session immediately"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Lock</span>
          </button>

          {/* Profile Badge */}
          <button
            onClick={() => onTabChange('security')}
            title="User security status"
            className="flex items-center gap-2 pl-2 border-l border-slate-800 text-left focus:outline-none"
          >
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">
              AV
            </div>
            <div className="hidden xl:block leading-none">
              <div className="text-xs font-medium text-slate-200">A. Vance</div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-0.5">
                <ShieldCheck className="w-3 h-3" />
                <span>Encrypted</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile subnav row for small screens */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-900 bg-slate-950 px-2 py-2 overflow-x-auto text-xs">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'dashboard' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onTabChange('accounts')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'accounts' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          Accounts
        </button>
        <button
          onClick={() => onTabChange('analytics')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'analytics' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          Spending
        </button>
        <button
          onClick={() => onTabChange('transfers')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'transfers' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          Transfers
        </button>
        <button
          onClick={() => onTabChange('security')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'security' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          Vault
        </button>
      </div>
    </header>
  );
};
