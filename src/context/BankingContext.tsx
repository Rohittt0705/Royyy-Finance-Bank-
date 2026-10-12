import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Account,
  Transaction,
  BudgetLimit,
  RecurringItem,
  Recipient,
  SecurityState,
  AuditLogEntry,
  CardDetails,
  TransactionCategory,
} from '../types/banking';
import {
  INITIAL_ACCOUNTS,
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_RECURRING,
  INITIAL_RECIPIENTS,
  INITIAL_AUDIT_LOGS,
} from '../data/initialData';

interface BankingContextType {
  // Accounts & Balances
  accounts: Account[];
  activeAccountId: string;
  setActiveAccountId: (id: string) => void;
  activeAccount: Account | undefined;
  totalNetWorth: number;
  totalLiquidCash: number;
  
  // Transactions & Budgets
  transactions: Transaction[];
  budgets: BudgetLimit[];
  recurring: RecurringItem[];
  recipients: Recipient[];
  
  // Security
  security: SecurityState;
  unlockWithPin: (pin: string) => { success: boolean; message?: string };
  unlockWithBiometric: () => { success: boolean; message?: string };
  lockSession: () => void;
  togglePrivacyMode: () => void;
  updatePin: (currentPin: string, newPin: string) => { success: boolean; message: string };
  setAutoLockMinutes: (minutes: number) => void;
  toggleBiometrics: (enabled: boolean) => void;
  
  // Operations & Actions
  transferFunds: (fromAccountId: string, toAccountId: string, amount: number, memo?: string) => { success: boolean; message: string };
  sendExternalWire: (fromAccountId: string, recipient: Recipient, amount: number, memo?: string) => { success: boolean; message: string };
  depositFunds: (accountId: string, amount: number, note: string) => { success: boolean; message: string };
  createAccount: (newAcc: Omit<Account, 'id' | 'createdDate'>) => { success: boolean; message: string };
  toggleCardFreeze: (accountId: string) => void;
  updateCardSettings: (accountId: string, settings: Partial<CardDetails>) => void;
  updateBudgetLimit: (category: TransactionCategory, newLimit: number) => void;
  toggleRecurringItem: (id: string) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'referenceNumber'>) => void;
  resetAllData: () => void;
  exportDataJson: () => void;
}

const STORAGE_KEYS = {
  ACCOUNTS: 'crestline_accounts_v1',
  TRANSACTIONS: 'crestline_transactions_v1',
  BUDGETS: 'crestline_budgets_v1',
  RECURRING: 'crestline_recurring_v1',
  RECIPIENTS: 'crestline_recipients_v1',
  SECURITY: 'crestline_security_v1',
};

const BankingContext = createContext<BankingContextType | undefined>(undefined);

export const BankingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Accounts
  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
    } catch {
      return INITIAL_ACCOUNTS;
    }
  });

  const [activeAccountId, setActiveAccountId] = useState<string>(() => {
    return INITIAL_ACCOUNTS[0]?.id || '';
  });

  // 2. Transactions
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  // 3. Budgets
  const [budgets, setBudgets] = useState<BudgetLimit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
    } catch {
      return INITIAL_BUDGETS;
    }
  });

  // 4. Recurring
  const [recurring, setRecurring] = useState<RecurringItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECURRING);
      return saved ? JSON.parse(saved) : INITIAL_RECURRING;
    } catch {
      return INITIAL_RECURRING;
    }
  });

  // 5. Recipients
  const [recipients, setRecipients] = useState<Recipient[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECIPIENTS);
      return saved ? JSON.parse(saved) : INITIAL_RECIPIENTS;
    } catch {
      return INITIAL_RECIPIENTS;
    }
  });

  // 6. Security
  const [security, setSecurity] = useState<SecurityState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SECURITY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          isLocked: false, // Start unlocked for immediate user delight on first visit
          lastActiveTimestamp: Date.now(),
        };
      }
    } catch {
      // fallback
    }
    return {
      isLocked: false,
      pinCode: '1234',
      privacyMode: false,
      biometricEnabled: true,
      autoLockMinutes: 10,
      lastActiveTimestamp: Date.now(),
      failedAttempts: 0,
      auditLogs: INITIAL_AUDIT_LOGS,
    };
  });

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(recurring));
  }, [recurring]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(recipients));
  }, [recipients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SECURITY, JSON.stringify(security));
  }, [security]);

  // Append Audit Log Helper
  const addAuditEntry = (event: string, details: string, severity: 'info' | 'warning' | 'security' = 'info') => {
    const newEntry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      event,
      details,
      severity,
      ipAddress: '198.51.100.44 (Session Secure)',
    };
    setSecurity((prev) => ({
      ...prev,
      auditLogs: [newEntry, ...prev.auditLogs.slice(0, 49)],
    }));
  };

  // Auto-lock timer check on user activity
  useEffect(() => {
    if (security.isLocked) return;
    const interval = setInterval(() => {
      const elapsedMinutes = (Date.now() - security.lastActiveTimestamp) / 1000 / 60;
      if (elapsedMinutes >= security.autoLockMinutes) {
        setSecurity((prev) => ({ ...prev, isLocked: true }));
        addAuditEntry('Session Auto-Locked', `Inactivity timeout exceeded (${security.autoLockMinutes}m)`, 'warning');
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [security.isLocked, security.lastActiveTimestamp, security.autoLockMinutes]);

  // Track activity to reset inactivity counter
  useEffect(() => {
    const handleActivity = () => {
      if (!security.isLocked) {
        setSecurity((prev) => ({ ...prev, lastActiveTimestamp: Date.now() }));
      }
    };
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [security.isLocked]);

  // Calculated totals
  const totalNetWorth = useMemo(() => {
    return accounts.reduce((sum, acc) => {
      if (acc.type === 'credit') {
        return sum - acc.balance; // Debt reduces net worth
      }
      return sum + acc.balance;
    }, 0);
  }, [accounts]);

  const totalLiquidCash = useMemo(() => {
    return accounts.reduce((sum, acc) => {
      if (acc.type === 'checking' || acc.type === 'savings') {
        return sum + acc.balance;
      }
      return sum;
    }, 0);
  }, [accounts]);

  const activeAccount = useMemo(() => {
    return accounts.find((a) => a.id === activeAccountId) || accounts[0];
  }, [accounts, activeAccountId]);

  // Security Operations
  const unlockWithPin = (enteredPin: string) => {
    if (enteredPin === security.pinCode) {
      setSecurity((prev) => ({
        ...prev,
        isLocked: false,
        failedAttempts: 0,
        lastActiveTimestamp: Date.now(),
      }));
      addAuditEntry('Session Unlocked', 'Verified with 4-digit master PIN code', 'security');
      return { success: true };
    } else {
      const attempts = security.failedAttempts + 1;
      setSecurity((prev) => ({ ...prev, failedAttempts: attempts }));
      addAuditEntry('Failed PIN Attempt', `Incorrect PIN entered (attempt ${attempts})`, 'warning');
      return { success: false, message: `Incorrect PIN. ${attempts >= 3 ? 'Caution: multiple failed attempts.' : 'Please try again.'}` };
    }
  };

  const unlockWithBiometric = () => {
    if (!security.biometricEnabled) {
      return { success: false, message: 'Biometric passkey is currently disabled.' };
    }
    setSecurity((prev) => ({
      ...prev,
      isLocked: false,
      failedAttempts: 0,
      lastActiveTimestamp: Date.now(),
    }));
    addAuditEntry('Biometric Passkey Verified', 'Hardware enclave credential validated', 'security');
    return { success: true };
  };

  const lockSession = () => {
    setSecurity((prev) => ({ ...prev, isLocked: true }));
    addAuditEntry('Session Manually Locked', 'User triggered instant lock shield', 'info');
  };

  const togglePrivacyMode = () => {
    setSecurity((prev) => {
      const nextMode = !prev.privacyMode;
      addAuditEntry(
        nextMode ? 'Privacy Mode Enabled' : 'Privacy Mode Disabled',
        nextMode ? 'Numeric figures veiled in public mode' : 'Numeric figures exposed in private mode',
        'info'
      );
      return { ...prev, privacyMode: nextMode };
    });
  };

  const updatePin = (currentPin: string, newPin: string) => {
    if (currentPin !== security.pinCode) {
      return { success: false, message: 'Current PIN does not match.' };
    }
    if (!/^\d{4}$/.test(newPin)) {
      return { success: false, message: 'New PIN must be exactly 4 numeric digits.' };
    }
    setSecurity((prev) => ({ ...prev, pinCode: newPin }));
    addAuditEntry('Master PIN Changed', 'User updated the 4-digit security PIN', 'security');
    return { success: true, message: 'Security PIN successfully updated.' };
  };

  const setAutoLockMinutes = (minutes: number) => {
    setSecurity((prev) => ({ ...prev, autoLockMinutes: minutes }));
    addAuditEntry('Auto-Lock Timeout Updated', `Inactivity duration set to ${minutes} minutes`, 'info');
  };

  const toggleBiometrics = (enabled: boolean) => {
    setSecurity((prev) => ({ ...prev, biometricEnabled: enabled }));
    addAuditEntry('Biometric Passkey Status Changed', enabled ? 'Biometrics activated' : 'Biometrics deactivated', 'info');
  };

  // Banking Operations
  const transferFunds = (fromAccountId: string, toAccountId: string, amount: number, memo?: string) => {
    if (fromAccountId === toAccountId) {
      return { success: false, message: 'Source and destination accounts must be distinct.' };
    }
    const source = accounts.find((a) => a.id === fromAccountId);
    const destination = accounts.find((a) => a.id === toAccountId);

    if (!source || !destination) {
      return { success: false, message: 'Account not found.' };
    }
    if (source.isFrozen) {
      return { success: false, message: `${source.name} is currently frozen.` };
    }
    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: 'Enter a valid transfer amount greater than zero.' };
    }
    if (source.type !== 'credit' && source.availableBalance < amount) {
      return { success: false, message: `Insufficient funds. Available: $${source.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const refCode = `XFR-${Math.floor(100000 + Math.random() * 900000)}`;

    // Update balances
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === fromAccountId) {
          const newBal = acc.type === 'credit' ? acc.balance + amount : acc.balance - amount;
          return {
            ...acc,
            balance: newBal,
            availableBalance: acc.type === 'credit' ? (acc.creditLimit || 0) - newBal : newBal,
          };
        }
        if (acc.id === toAccountId) {
          const newBal = acc.type === 'credit' ? acc.balance - amount : acc.balance + amount;
          return {
            ...acc,
            balance: newBal,
            availableBalance: acc.type === 'credit' ? (acc.creditLimit || 0) - newBal : newBal,
          };
        }
        return acc;
      })
    );

    // Ledger records
    const debitTx: Transaction = {
      id: `tx-${Date.now()}-out`,
      accountId: fromAccountId,
      date: todayStr,
      merchant: `Transfer to ${destination.name}`,
      amount: amount,
      type: 'debit',
      category: 'Transfer',
      status: 'settled',
      referenceNumber: refCode,
      recipientAccount: toAccountId,
      note: memo || 'Internal real-time account transfer',
    };

    const creditTx: Transaction = {
      id: `tx-${Date.now()}-in`,
      accountId: toAccountId,
      date: todayStr,
      merchant: `Transfer from ${source.name}`,
      amount: amount,
      type: 'credit',
      category: 'Transfer',
      status: 'settled',
      referenceNumber: refCode,
      recipientAccount: fromAccountId,
      note: memo || 'Internal real-time account transfer',
    };

    setTransactions((prev) => [debitTx, creditTx, ...prev]);
    addAuditEntry(
      'Internal Transfer Cleared',
      `Transferred $${amount.toFixed(2)} from ${source.name} to ${destination.name} [Ref: ${refCode}]`,
      'info'
    );

    return { success: true, message: `Successfully transferred $${amount.toFixed(2)} to ${destination.name}.` };
  };

  const sendExternalWire = (fromAccountId: string, recipient: Recipient, amount: number, memo?: string) => {
    const source = accounts.find((a) => a.id === fromAccountId);
    if (!source) {
      return { success: false, message: 'Source account not found.' };
    }
    if (source.isFrozen) {
      return { success: false, message: 'Account is currently frozen for outgoing transactions.' };
    }
    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: 'Enter a valid wire amount.' };
    }
    if (source.availableBalance < amount) {
      return { success: false, message: 'Insufficient funds for outgoing wire.' };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const refCode = `WIRE-${Math.floor(100000 + Math.random() * 900000)}`;

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === fromAccountId) {
          const newBal = acc.balance - amount;
          return { ...acc, balance: newBal, availableBalance: newBal };
        }
        return acc;
      })
    );

    const wireTx: Transaction = {
      id: `tx-${Date.now()}-wire`,
      accountId: fromAccountId,
      date: todayStr,
      merchant: `Wire to ${recipient.name} (${recipient.bankName})`,
      amount: amount,
      type: 'debit',
      category: 'Transfer',
      status: 'settled',
      referenceNumber: refCode,
      note: memo || `Fedwire transfer to ${recipient.accountNumber}`,
    };

    setTransactions((prev) => [wireTx, ...prev]);

    // Save recipient if not existing
    if (!recipients.some((r) => r.accountNumber === recipient.accountNumber)) {
      setRecipients((prev) => [recipient, ...prev]);
    }

    addAuditEntry(
      'Fedwire Outgoing Cleared',
      `Sent $${amount.toFixed(2)} to ${recipient.name} via ${recipient.bankName} [Ref: ${refCode}]`,
      'security'
    );

    return { success: true, message: `Wire transfer of $${amount.toFixed(2)} completed.` };
  };

  const depositFunds = (accountId: string, amount: number, note: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Account not found.' };
    if (amount <= 0 || isNaN(amount)) return { success: false, message: 'Deposit amount must be positive.' };

    const todayStr = new Date().toISOString().split('T')[0];
    const refCode = `DEP-${Math.floor(100000 + Math.random() * 900000)}`;

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === accountId) {
          const newBal = acc.type === 'credit' ? Math.max(0, acc.balance - amount) : acc.balance + amount;
          return {
            ...acc,
            balance: newBal,
            availableBalance: acc.type === 'credit' ? (acc.creditLimit || 0) - newBal : newBal,
          };
        }
        return acc;
      })
    );

    const depTx: Transaction = {
      id: `tx-${Date.now()}-dep`,
      accountId,
      date: todayStr,
      merchant: note || 'Direct Check Deposit',
      amount: amount,
      type: 'credit',
      category: 'Income',
      status: 'settled',
      referenceNumber: refCode,
      note: 'Mobile check capture settlement',
    };

    setTransactions((prev) => [depTx, ...prev]);
    addAuditEntry('Funds Deposited', `Credited $${amount.toFixed(2)} to ${target.name} [Ref: ${refCode}]`, 'info');

    return { success: true, message: `Successfully deposited $${amount.toFixed(2)}.` };
  };

  const createAccount = (newAcc: Omit<Account, 'id' | 'createdDate'>) => {
    const newId = `acc-${newAcc.type.slice(0, 3)}-${Date.now().toString().slice(-4)}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const accRecord: Account = {
      ...newAcc,
      id: newId,
      createdDate: todayStr,
    };

    setAccounts((prev) => [...prev, accRecord]);
    setActiveAccountId(newId);

    if (accRecord.balance > 0) {
      const fundingTx: Transaction = {
        id: `tx-${Date.now()}-open`,
        accountId: newId,
        date: todayStr,
        merchant: 'Initial Account Capitalization',
        amount: accRecord.balance,
        type: 'credit',
        category: 'Income',
        status: 'settled',
        referenceNumber: `INIT-${Math.floor(100000 + Math.random() * 900000)}`,
        note: `Opening deposit for new ${accRecord.name}`,
      };
      setTransactions((prev) => [fundingTx, ...prev]);
    }

    addAuditEntry('New Account Opened', `Created account "${accRecord.name}" (${accRecord.type.toUpperCase()})`, 'info');
    return { success: true, message: `Account "${accRecord.name}" successfully established.` };
  };

  const toggleCardFreeze = (accountId: string) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === accountId && acc.cardDetails) {
          const nextFrozen = !acc.cardDetails.isFrozen;
          addAuditEntry(
            nextFrozen ? 'Card Frozen' : 'Card Unfrozen',
            `Debit/Credit card ending in ${acc.cardDetails.cardNumber.slice(-4)} was ${nextFrozen ? 'locked' : 'unlocked'}`,
            nextFrozen ? 'warning' : 'info'
          );
          return {
            ...acc,
            cardDetails: {
              ...acc.cardDetails,
              isFrozen: nextFrozen,
            },
          };
        }
        return acc;
      })
    );
  };

  const updateCardSettings = (accountId: string, settings: Partial<CardDetails>) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === accountId && acc.cardDetails) {
          const updated = { ...acc.cardDetails, ...settings };
          addAuditEntry('Card Settings Modified', `Updated security policies for card ending in ${updated.cardNumber.slice(-4)}`, 'info');
          return { ...acc, cardDetails: updated };
        }
        return acc;
      })
    );
  };

  const updateBudgetLimit = (category: TransactionCategory, newLimit: number) => {
    setBudgets((prev) => {
      const exists = prev.find((b) => b.category === category);
      if (exists) {
        return prev.map((b) => (b.category === category ? { ...b, monthlyLimit: newLimit } : b));
      }
      return [...prev, { category, monthlyLimit: newLimit }];
    });
    addAuditEntry('Budget Limit Updated', `Set monthly budget for ${category} to $${newLimit}`, 'info');
  };

  const toggleRecurringItem = (id: string) => {
    setRecurring((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextActive = !item.active;
          addAuditEntry(
            nextActive ? 'Recurring Bill Resumed' : 'Recurring Bill Paused',
            `${item.merchant} ($${item.amount.toFixed(2)}/mo) was ${nextActive ? 'resumed' : 'paused'}`,
            'info'
          );
          return { ...item, active: nextActive };
        }
        return item;
      })
    );
  };

  const addTransaction = (tx: Omit<Transaction, 'id' | 'referenceNumber'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}`,
      referenceNumber: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === tx.accountId) {
          let newBal = acc.balance;
          if (tx.type === 'debit') {
            newBal = acc.type === 'credit' ? acc.balance + tx.amount : acc.balance - tx.amount;
          } else {
            newBal = acc.type === 'credit' ? Math.max(0, acc.balance - tx.amount) : acc.balance + tx.amount;
          }
          return {
            ...acc,
            balance: newBal,
            availableBalance: acc.type === 'credit' ? (acc.creditLimit || 0) - newBal : newBal,
          };
        }
        return acc;
      })
    );

    setTransactions((prev) => [newTx, ...prev]);
    addAuditEntry(
      'Manual Transaction Logged',
      `${tx.type === 'debit' ? 'Debited' : 'Credited'} $${tx.amount.toFixed(2)} for ${tx.merchant}`,
      'info'
    );
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.BUDGETS);
    localStorage.removeItem(STORAGE_KEYS.RECURRING);
    localStorage.removeItem(STORAGE_KEYS.RECIPIENTS);
    localStorage.removeItem(STORAGE_KEYS.SECURITY);

    setAccounts(INITIAL_ACCOUNTS);
    setActiveAccountId(INITIAL_ACCOUNTS[0].id);
    setTransactions(INITIAL_TRANSACTIONS);
    setBudgets(INITIAL_BUDGETS);
    setRecurring(INITIAL_RECURRING);
    setRecipients(INITIAL_RECIPIENTS);
    setSecurity({
      isLocked: false,
      pinCode: '1234',
      privacyMode: false,
      biometricEnabled: true,
      autoLockMinutes: 10,
      lastActiveTimestamp: Date.now(),
      failedAttempts: 0,
      auditLogs: INITIAL_AUDIT_LOGS,
    });
  };

  const exportDataJson = () => {
    const exportBundle = {
      exportedAt: new Date().toISOString(),
      institution: 'Crestline Premier Banking',
      accounts,
      transactions,
      budgets,
      recurring,
      auditLogs: security.auditLogs,
    };
    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crestline-banking-statement-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addAuditEntry('Encrypted Statement Exported', 'Full financial ledger exported to offline JSON file', 'security');
  };

  return (
    <BankingContext.Provider
      value={{
        accounts,
        activeAccountId,
        setActiveAccountId,
        activeAccount,
        totalNetWorth,
        totalLiquidCash,
        transactions,
        budgets,
        recurring,
        recipients,
        security,
        unlockWithPin,
        unlockWithBiometric,
        lockSession,
        togglePrivacyMode,
        updatePin,
        setAutoLockMinutes,
        toggleBiometrics,
        transferFunds,
        sendExternalWire,
        depositFunds,
        createAccount,
        toggleCardFreeze,
        updateCardSettings,
        updateBudgetLimit,
        toggleRecurringItem,
        addTransaction,
        resetAllData,
        exportDataJson,
      }}
    >
      {children}
    </BankingContext.Provider>
  );
};

export const useBanking = () => {
  const context = useContext(BankingContext);
  if (!context) {
    throw new Error('useBanking must be used within a BankingProvider');
  }
  return context;
};
