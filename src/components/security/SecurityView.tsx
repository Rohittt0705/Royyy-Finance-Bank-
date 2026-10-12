import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Fingerprint,
  Clock,
  EyeOff,
  AlertTriangle,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity,
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatDateTime } from '../../utils/formatters';
import { AuditSeverity } from '../../types/banking';

export const SecurityView: React.FC = () => {
  const {
    security,
    lockSession,
    updatePin,
    setAutoLockMinutes,
    toggleBiometrics,
    togglePrivacyMode,
    accounts,
    toggleCardFreeze,
    exportDataJson,
    resetAllData,
  } = useBanking();

  // Change PIN state
  const [currentPin, setCurrentPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [pinFeedback, setPinFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Audit filter state
  const [auditFilter, setAuditFilter] = useState<string>('all');

  const handlePinChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin !== confirmPin) {
      setPinFeedback({ type: 'error', message: 'New PIN and confirmation do not match.' });
      return;
    }
    const res = updatePin(currentPin, newPin);
    if (res.success) {
      setPinFeedback({ type: 'success', message: res.message });
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } else {
      setPinFeedback({ type: 'error', message: res.message });
    }
  };

  const handleEmergencyFreezeAll = () => {
    accounts.forEach((acc) => {
      if (acc.cardDetails && !acc.cardDetails.isFrozen) {
        toggleCardFreeze(acc.id);
      }
    });
  };

  const filteredLogs = security.auditLogs.filter((log) => {
    if (auditFilter === 'all') return true;
    return log.severity === auditFilter;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Security Enclave & Cryptographic Vault</span>
        </h1>
        <p className="text-xs text-slate-400">
          Biometric credentials, auto-lock policies, hardware security keys, and real-time audit ledger
        </p>
      </div>

      {/* Security Status Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Active Session Sealed</h2>
              <span className="text-[11px] font-mono text-emerald-400">AES-GCM-256</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Current Master PIN is active. Auto-lock timeout set to {security.autoLockMinutes} minutes of inactivity.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={lockSession}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Session Now</span>
          </button>
          <button
            type="button"
            onClick={exportDataJson}
            className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Statement</span>
          </button>
        </div>
      </div>

      {/* Security Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Policies & PIN update */}
        <div className="lg:col-span-7 space-y-6">
          {/* Change PIN Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>Modify Master Security PIN</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">4-Digit Numeric</span>
            </div>

            {pinFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  pinFeedback.type === 'success'
                    ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                }`}
              >
                {pinFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{pinFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handlePinChangeSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Current PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="••••"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">New 4-Digit PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="••••"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Confirm New PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500">Default demo PIN is 1234</span>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs transition-colors"
                >
                  Update PIN
                </button>
              </div>
            </form>
          </div>

          {/* Session & Privacy Policies */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white">Session Security Policies</h3>

            <div className="space-y-4 divide-y divide-slate-800">
              {/* Biometric Toggle */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Biometric Passkeys (Face ID / Touch ID)</div>
                    <div className="text-[11px] text-slate-400">Validate sessions with hardware biometric sensors</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleBiometrics(!security.biometricEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    security.biometricEnabled ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      security.biometricEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Inactivity Auto-Lock duration */}
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Inactivity Auto-Lock</div>
                    <div className="text-[11px] text-slate-400">Automatically shield session after idle time</div>
                  </div>
                </div>
                <select
                  value={security.autoLockMinutes}
                  onChange={(e) => setAutoLockMinutes(parseInt(e.target.value, 10))}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                >
                  <option value={1}>1 minute</option>
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={30}>30 minutes</option>
                </select>
              </div>

              {/* Public Privacy Mode */}
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                    <EyeOff className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Public Privacy Obfuscation</div>
                    <div className="text-[11px] text-slate-400">Mask all numerical balances with •••••• tokens</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={togglePrivacyMode}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    security.privacyMode ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      security.privacyMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Emergency Panic Controls */}
          <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-4">
            <h3 className="text-sm font-semibold text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Emergency Controls & Diagnostics</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              If physical device theft or suspicious activity is suspected, execute emergency freeze immediately to disable POS authorization and ATM taps across all cards.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleEmergencyFreezeAll}
                className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Freeze All Linked Cards</span>
              </button>

              <button
                type="button"
                onClick={resetAllData}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to Clean Demo State</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Immutable Audit Trail */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Immutable Audit Ledger</span>
                </h3>
                <p className="text-xs text-slate-400">Cryptographically ordered session timeline</p>
              </div>
            </div>

            {/* Severity Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg text-[11px]">
              {['all', 'security', 'warning', 'info'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setAuditFilter(lvl)}
                  className={`flex-1 py-1 rounded capitalize transition-colors ${
                    auditFilter === lvl ? 'bg-slate-700 text-white font-medium' : 'text-slate-400'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Audit Log Entries List */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredLogs.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{entry.event}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded capitalize ${
                        entry.severity === 'security'
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                          : entry.severity === 'warning'
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {entry.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{entry.details}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
                    <span>{formatDateTime(entry.timestamp)}</span>
                    <span>{entry.ipAddress}</span>
                  </div>
                </div>
              ))}

              {filteredLogs.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500">
                  No audit logs matching "{auditFilter}".
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
