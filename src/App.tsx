import React, { useState } from 'react';
import { BankingProvider, useBanking } from './context/BankingContext';
import { Navbar, NavTab } from './components/layout/Navbar';
import { LockScreen } from './components/security/LockScreen';
import { DashboardView } from './components/dashboard/DashboardView';
import { AccountsView } from './components/accounts/AccountsView';
import { SpendingAnalyticsView } from './components/analytics/SpendingAnalyticsView';
import { TransfersView } from './components/transfers/TransfersView';
import { SecurityView } from './components/security/SecurityView';
import { TransferModal } from './components/modals/TransferModal';
import { DepositModal } from './components/modals/DepositModal';
import { NewAccountModal } from './components/modals/NewAccountModal';
import { TransactionDetailModal } from './components/modals/TransactionDetailModal';
import { Transaction } from './types/banking';
import { Shield, Lock } from 'lucide-react';

function BankingApp() {
  const { security } = useBanking();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Modal triggers
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState<boolean>(false);
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState<boolean>(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* If session is locked, display the PIN/biometric screen */}
      {security.isLocked && <LockScreen />}

      {/* Top Bar Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenTransferModal={() => setIsTransferModalOpen(true)}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            onNavigateTab={setCurrentTab}
            onOpenTransferModal={() => setIsTransferModalOpen(true)}
            onOpenDepositModal={() => setIsDepositModalOpen(true)}
            onOpenNewAccountModal={() => setIsNewAccountModalOpen(true)}
            onSelectTransaction={(tx) => setSelectedTx(tx)}
          />
        )}

        {currentTab === 'accounts' && (
          <AccountsView
            onOpenTransferModal={() => setIsTransferModalOpen(true)}
            onOpenDepositModal={() => setIsDepositModalOpen(true)}
            onOpenNewAccountModal={() => setIsNewAccountModalOpen(true)}
            onSelectTransaction={(tx) => setSelectedTx(tx)}
          />
        )}

        {currentTab === 'analytics' && (
          <SpendingAnalyticsView
            onSelectTransaction={(tx) => setSelectedTx(tx)}
          />
        )}

        {currentTab === 'transfers' && (
          <TransfersView
            onSelectTransaction={(tx) => setSelectedTx(tx)}
          />
        )}

        {currentTab === 'security' && (
          <SecurityView />
        )}
      </main>

      {/* Modals */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />

      <NewAccountModal
        isOpen={isNewAccountModalOpen}
        onClose={() => setIsNewAccountModalOpen(false)}
      />

      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />

      {/* Clean quiet corporate footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Crestline Premier Bank, N.A. Member FDIC. Equal Housing Lender.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Routing Transit #021000021</span>
            <span>·</span>
            <span>Hardware Enclave Secured</span>
            <span>·</span>
            <button
              onClick={() => setCurrentTab('security')}
              className="hover:text-emerald-400 transition-colors"
            >
              Security Center
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BankingProvider>
      <BankingApp />
    </BankingProvider>
  );
}
