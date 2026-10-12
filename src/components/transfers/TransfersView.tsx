import React, { useState } from 'react';
import {
  ArrowRight,
  Send,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building,
  KeyRound,
  UserCheck,
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Recipient, Transaction } from '../../types/banking';

type TransferMode = 'internal' | 'wire' | 'deposit';

interface TransfersViewProps {
  onSelectTransaction: (tx: Transaction) => void;
}

export const TransfersView: React.FC<TransfersViewProps> = ({ onSelectTransaction }) => {
  const {
    accounts,
    recipients,
    transferFunds,
    sendExternalWire,
    depositFunds,
    transactions,
    security,
  } = useBanking();

  const [mode, setMode] = useState<TransferMode>('internal');

  // Internal transfer form state
  const [internalFromId, setInternalFromId] = useState<string>(accounts[0]?.id || '');
  const [internalToId, setInternalToId] = useState<string>(accounts[1]?.id || accounts[0]?.id || '');
  const [internalAmount, setInternalAmount] = useState<string>('');
  const [internalMemo, setInternalMemo] = useState<string>('');

  // Wire form state
  const [wireFromId, setWireFromId] = useState<string>(accounts[0]?.id || '');
  const [wireRecipientMode, setWireRecipientMode] = useState<'saved' | 'new'>('saved');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(recipients[0]?.id || '');
  const [newRecipientName, setNewRecipientName] = useState<string>('');
  const [newRecipientBank, setNewRecipientBank] = useState<string>('');
  const [newRecipientAccount, setNewRecipientAccount] = useState<string>('');
  const [newRecipientRouting, setNewRecipientRouting] = useState<string>('021000021');
  const [wireAmount, setWireAmount] = useState<string>('');
  const [wireMemo, setWireMemo] = useState<string>('');
  const [wirePinPrompt, setWirePinPrompt] = useState<boolean>(false);
  const [wirePinInput, setWirePinInput] = useState<string>('');

  // Deposit form state
  const [depositTargetId, setDepositTargetId] = useState<string>(accounts[0]?.id || '');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [depositPayer, setDepositPayer] = useState<string>('Client Advisory Clearing');

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const internalSource = accounts.find((a) => a.id === internalFromId);

  // Handle Internal Transfer
  const handleInternalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(internalAmount);
    if (isNaN(amount) || amount <= 0) {
      setNotification({ type: 'error', message: 'Enter a valid transfer amount.' });
      return;
    }
    setIsProcessing(true);
    setNotification(null);

    setTimeout(() => {
      const res = transferFunds(internalFromId, internalToId, amount, internalMemo);
      setIsProcessing(false);
      if (res.success) {
        setNotification({ type: 'success', message: res.message });
        setInternalAmount('');
        setInternalMemo('');
      } else {
        setNotification({ type: 'error', message: res.message });
      }
    }, 300);
  };

  // Handle Wire submission - Stage 1: Trigger PIN challenge
  const handleWirePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(wireAmount);
    if (isNaN(amount) || amount <= 0) {
      setNotification({ type: 'error', message: 'Enter a valid wire amount.' });
      return;
    }
    setWirePinPrompt(true);
    setWirePinInput('');
  };

  // Handle Wire submission - Stage 2: Verify PIN & Execute
  const handleConfirmWireWithPin = () => {
    if (wirePinInput !== security.pinCode) {
      setNotification({ type: 'error', message: 'Master security PIN mismatch. Wire authorization denied.' });
      setWirePinInput('');
      return;
    }

    const amount = parseFloat(wireAmount);
    let recipientToUse: Recipient;

    if (wireRecipientMode === 'saved') {
      const found = recipients.find((r) => r.id === selectedRecipientId);
      if (!found) {
        setNotification({ type: 'error', message: 'Recipient not selected.' });
        return;
      }
      recipientToUse = found;
    } else {
      if (!newRecipientName || !newRecipientBank || !newRecipientAccount) {
        setNotification({ type: 'error', message: 'Please provide full recipient information.' });
        return;
      }
      recipientToUse = {
        id: `recip-${Date.now()}`,
        name: newRecipientName,
        bankName: newRecipientBank,
        accountNumber: newRecipientAccount,
        routingNumber: newRecipientRouting || '021000021',
      };
    }

    setIsProcessing(true);
    setWirePinPrompt(false);

    setTimeout(() => {
      const res = sendExternalWire(wireFromId, recipientToUse, amount, wireMemo);
      setIsProcessing(false);
      if (res.success) {
        setNotification({ type: 'success', message: res.message });
        setWireAmount('');
        setWireMemo('');
      } else {
        setNotification({ type: 'error', message: res.message });
      }
    }, 450);
  };

  // Handle Check Deposit
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setNotification({ type: 'error', message: 'Enter a valid deposit amount.' });
      return;
    }
    setIsProcessing(true);
    setNotification(null);

    setTimeout(() => {
      const res = depositFunds(depositTargetId, amount, depositPayer);
      setIsProcessing(false);
      if (res.success) {
        setNotification({ type: 'success', message: res.message });
        setDepositAmount('');
      } else {
        setNotification({ type: 'error', message: res.message });
      }
    }, 350);
  };

  // Recent transfer transactions
  const transferHistory = transactions.filter(
    (t) => t.category === 'Transfer' || t.referenceNumber.startsWith('WIRE') || t.referenceNumber.startsWith('DEP')
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Send className="w-5 h-5 text-emerald-400" />
          <span>Money Movement & High-Value Transfers</span>
        </h1>
        <p className="text-xs text-slate-400">
          Internal multi-account reallocations, Fedwire clearing, and simulated check capture
        </p>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setMode('internal');
            setNotification(null);
          }}
          className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            mode === 'internal'
              ? 'bg-emerald-400 text-slate-950 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>Internal Account Transfer</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('wire');
            setNotification(null);
          }}
          className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            mode === 'wire'
              ? 'bg-emerald-400 text-slate-950 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Fedwire & ACH Outgoing</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('deposit');
            setNotification(null);
          }}
          className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            mode === 'deposit'
              ? 'bg-emerald-400 text-slate-950 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>Deposit Check or Capital</span>
        </button>
      </div>

      {/* Status banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-800 text-rose-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Form Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          {/* Internal Transfer Form */}
          {mode === 'internal' && (
            <form onSubmit={handleInternalSubmit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-sm font-semibold text-white">Instant Account Reallocation</h2>
                <span className="text-[11px] text-emerald-400 font-mono">Zero Fee · Immediate Settlement</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">From Source</label>
                  <select
                    value={internalFromId}
                    onChange={(e) => setInternalFromId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatCurrency(a.availableBalance, security.privacyMode)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">To Destination</label>
                  <select
                    value={internalToId}
                    onChange={(e) => setInternalToId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {accounts
                      .filter((a) => a.id !== internalFromId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({formatCurrency(a.balance, security.privacyMode)})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label className="font-medium text-slate-300">Transfer Amount</label>
                  {internalSource && (
                    <button
                      type="button"
                      onClick={() => setInternalAmount(internalSource.availableBalance.toFixed(2))}
                      className="text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      Max: {formatCurrency(internalSource.availableBalance, security.privacyMode)}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="2500.00"
                    value={internalAmount}
                    onChange={(e) => setInternalAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 font-mono text-base text-white focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Internal Memo</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly high-yield allocation"
                  value={internalMemo}
                  onChange={(e) => setInternalMemo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing || !internalAmount}
                  className="w-full py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>{isProcessing ? 'Executing Transfer...' : 'Authorize Immediate Transfer'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Wire Form */}
          {mode === 'wire' && (
            <form onSubmit={handleWirePreSubmit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-sm font-semibold text-white">Fedwire Real-Time Gross Settlement</h2>
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Dual-Control Verification
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Debit Account</label>
                <select
                  value={wireFromId}
                  onChange={(e) => setWireFromId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — Avail: {formatCurrency(a.availableBalance, security.privacyMode)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Saved vs New Payee Toggle */}
              <div className="flex items-center gap-2 p-1 bg-slate-800 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setWireRecipientMode('saved')}
                  className={`flex-1 py-1.5 rounded-md transition-colors ${
                    wireRecipientMode === 'saved' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400'
                  }`}
                >
                  Saved Counterparties
                </button>
                <button
                  type="button"
                  onClick={() => setWireRecipientMode('new')}
                  className={`flex-1 py-1.5 rounded-md transition-colors ${
                    wireRecipientMode === 'new' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400'
                  }`}
                >
                  New Beneficiary
                </button>
              </div>

              {wireRecipientMode === 'saved' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Select Beneficiary</label>
                  <select
                    value={selectedRecipientId}
                    onChange={(e) => setSelectedRecipientId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {recipients.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} — {r.bankName} ({r.accountNumber})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3 p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Beneficiary Legal Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Horizon Equity Partners LLC"
                      value={newRecipientName}
                      onChange={(e) => setNewRecipientName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">Receiving Bank</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Citibank N.A."
                        value={newRecipientBank}
                        onChange={(e) => setNewRecipientBank(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">9-Digit Fedwire Routing</label>
                      <input
                        type="text"
                        required
                        placeholder="021000021"
                        value={newRecipientRouting}
                        onChange={(e) => setNewRecipientRouting(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Account Transit Number</label>
                    <input
                      type="text"
                      required
                      placeholder="8492019482"
                      value={newRecipientAccount}
                      onChange={(e) => setNewRecipientAccount(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Wire Outflow Amount</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="5000.00"
                    value={wireAmount}
                    onChange={(e) => setWireAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 font-mono text-base text-white focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Fedwire Reference Memo</label>
                <input
                  type="text"
                  placeholder="Escrow settlement, invoice payoff"
                  value={wireMemo}
                  onChange={(e) => setWireMemo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing || !wireAmount}
                  className="w-full py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Building className="w-4 h-4" />
                  <span>Initiate Wire (Requires PIN Verification)</span>
                </button>
              </div>
            </form>
          )}

          {/* Deposit Form */}
          {mode === 'deposit' && (
            <form onSubmit={handleDepositSubmit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-sm font-semibold text-white">Direct Deposit & Mobile Check Capture</h2>
                <span className="text-[11px] text-emerald-400 font-mono">Immediate Liquidity Credit</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Credit Account</label>
                <select
                  value={depositTargetId}
                  onChange={(e) => setDepositTargetId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — Current Bal: {formatCurrency(a.balance, security.privacyMode)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Deposit Amount</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="3000.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 font-mono text-base text-white focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Payer / Remitter Information</label>
                <input
                  type="text"
                  required
                  value={depositPayer}
                  onChange={(e) => setDepositPayer(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing || !depositAmount}
                  className="w-full py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>{isProcessing ? 'Capturing Deposit...' : 'Authorize Immediate Inflow'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Security Verification & Transfer Ledger */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Federal Reserve & ACH Protocol</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every wire transfer is processed through Federal Reserve Fedwire lines with end-to-end hardware enclave encryption. Master security PIN authorization is strictly enforced on all external disbursements.
            </p>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div>Routing Transit: <span className="font-mono text-slate-200">021000021</span></div>
              <div>Institution: <span className="text-slate-200">Crestline Premier Bank NA</span></div>
              <div>Cutoff Time: <span className="text-slate-200">17:00 EST for same-day Fedwire</span></div>
            </div>
          </div>

          {/* Transfer History Table */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-white">Transfer Audit Log</h3>
            <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
              {transferHistory.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTransaction(t)}
                  className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-800/40 p-1.5 rounded cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-medium text-slate-200">{t.merchant}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {formatDate(t.date)} · {t.referenceNumber}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-mono font-medium tabular-nums ${
                        t.type === 'credit' ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      {t.type === 'debit' ? '-' : '+'}
                      {formatCurrency(t.amount, security.privacyMode)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Wire PIN Challenge Modal Overlay */}
      {wirePinPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-emerald-400">
              <KeyRound className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-white">Authorize Outgoing Wire</h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your 4-digit master PIN to sign this ${parseFloat(wireAmount || '0').toLocaleString()} wire.
              </p>
            </div>

            <div className="space-y-1.5">
              <input
                type="password"
                maxLength={4}
                autoFocus
                placeholder="••••"
                value={wirePinInput}
                onChange={(e) => setWirePinInput(e.target.value)}
                className="w-full text-center tracking-[0.5em] font-mono text-2xl bg-slate-800 border border-slate-700 rounded-xl py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <div className="text-[11px] text-slate-500 text-center">Demo PIN is 1234</div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWirePinPrompt(false)}
                className="flex-1 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWireWithPin}
                disabled={wirePinInput.length !== 4}
                className="flex-1 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-colors"
              >
                Sign & Transmit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
