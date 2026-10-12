import React, { useState, useEffect } from 'react';
import { Shield, Fingerprint, Delete, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';

export const LockScreen: React.FC = () => {
  const { unlockWithPin, unlockWithBiometric, security } = useBanking();
  const [pin, setPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isScanningBiometric, setIsScanningBiometric] = useState<boolean>(false);

  // Handle number click
  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMessage('');
      if (nextPin.length === 4) {
        // Attempt unlock automatically when 4 digits entered
        setTimeout(() => {
          const res = unlockWithPin(nextPin);
          if (!res.success) {
            setErrorMessage(res.message || 'Incorrect PIN code.');
            setPin('');
          }
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMessage('');
  };

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  const handleBiometricClick = () => {
    setIsScanningBiometric(true);
    setErrorMessage('');
    setTimeout(() => {
      const res = unlockWithBiometric();
      setIsScanningBiometric(false);
      if (!res.success) {
        setErrorMessage(res.message || 'Biometric validation failed.');
      }
    }, 900);
  };

  const handleQuickDemoPin = () => {
    setPin('1234');
    setTimeout(() => {
      unlockWithPin('1234');
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4 selection:bg-emerald-500/20">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(16,185,129,0.06),transparent_70%)] pointer-events-none" />

      <div className="relative w-full max-w-sm mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
        {/* Crestline Emblem */}
        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center mb-5 shadow-inner">
          <Shield className="w-7 h-7 text-emerald-400" />
        </div>

        <h1 className="text-xl font-bold text-slate-100 tracking-tight">Crestline Premier</h1>
        <p className="text-xs text-slate-400 mt-1 mb-6 text-center">
          Session locked. Enter your 4-digit security PIN or verify biometrics.
        </p>

        {/* PIN Indicators */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                pin.length > idx
                  ? 'bg-emerald-400 scale-110 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 mb-4 bg-rose-950/40 border border-rose-900/60 px-3 py-1.5 rounded-lg text-center animate-shake">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Numeric Keypad Grid */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px] mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="h-13 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 text-slate-100 text-lg font-mono font-medium border border-slate-700/60 active:scale-95 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-13 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors flex items-center justify-center"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-13 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 text-slate-100 text-lg font-mono font-medium border border-slate-700/60 active:scale-95 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Delete last digit"
            className="h-13 rounded-xl text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center active:scale-95"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Biometrics & Fast Demo Options */}
        <div className="w-full space-y-2.5">
          {security.biometricEnabled && (
            <button
              type="button"
              onClick={handleBiometricClick}
              disabled={isScanningBiometric}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-emerald-400 border border-slate-700/80 text-xs font-medium transition-all"
            >
              <Fingerprint className={`w-4 h-4 ${isScanningBiometric ? 'animate-pulse text-emerald-300' : ''}`} />
              <span>{isScanningBiometric ? 'Verifying Hardware Token...' : 'Verify with Face ID / Touch ID'}</span>
            </button>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 w-full">
            <span className="flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-slate-500" />
              Demo PIN: <strong className="text-slate-300 font-mono">1234</strong>
            </span>
            <button
              type="button"
              onClick={handleQuickDemoPin}
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors underline flex items-center gap-0.5"
            >
              <Sparkles className="w-3 h-3" />
              Quick Fill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
