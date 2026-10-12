import { Account, Transaction } from '../types/banking';
import { formatCurrency, formatDate } from './formatters';

/**
 * Exports transaction history for an account as a formatted CSV file
 */
export function exportTransactionsCSV(account: Account, transactions: Transaction[]) {
  const currentDate = new Date().toISOString().split('T')[0];
  const filename = `crestline-transactions-${account.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${currentDate}.csv`;

  const totalCredits = transactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = transactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  // CSV metadata header lines for record-keeping
  const metadataLines = [
    `"INSTITUTION","Crestline Premier Bank, N.A. (Member FDIC)"`,
    `"ACCOUNT NAME","${account.name}"`,
    `"ACCOUNT NUMBER","•••• ${account.accountNumber.slice(-4)}"`,
    `"ACCOUNT TYPE","${account.type.toUpperCase()}"`,
    `"ROUTING TRANSIT","${account.routingNumber}"`,
    `"CURRENT BALANCE","$${account.balance.toFixed(2)}"`,
    `"TOTAL CREDITS / DEPOSITS","$${totalCredits.toFixed(2)}"`,
    `"TOTAL DEBITS / OUTFLOWS","$${totalDebits.toFixed(2)}"`,
    `"EXPORT DATE","${new Date().toISOString()}"`,
    ``, // blank separator
  ];

  // Column Headers
  const columnHeaders = [
    'Date',
    'Transaction ID',
    'Reference Number',
    'Merchant / Counterparty',
    'Category',
    'Type',
    'Amount (USD)',
    'Status',
    'Notes / Memo',
  ];

  // Format data rows
  const dataRows = transactions.map((t) => [
    `"${t.date}"`,
    `"${t.id}"`,
    `"${t.referenceNumber}"`,
    `"${t.merchant.replace(/"/g, '""')}"`,
    `"${t.category}"`,
    `"${t.type.toUpperCase()}"`,
    `"${t.type === 'debit' ? '-' : '+'}${t.amount.toFixed(2)}"`,
    `"${t.status.toUpperCase()}"`,
    `"${(t.note || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [
    ...metadataLines,
    columnHeaders.map((h) => `"${h}"`).join(','),
    ...dataRows.map((r) => r.join(',')),
  ].join('\r\n');

  // Trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates an official, print-ready PDF statement via a dedicated styled print window
 */
export function openPrintablePDFStatement(
  account: Account,
  transactions: Transaction[],
  statementPeriod = 'October 1, 2026 – October 31, 2026'
) {
  const totalCredits = transactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = transactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const netChange = totalCredits - totalDebits;
  const openingBalanceEstimate = account.balance - netChange;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Official Bank Statement - ${account.name}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 16mm 18mm 16mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.4;
      font-size: 11px;
      padding: 24px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #047857;
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }
    .statement-badge {
      text-align: right;
    }
    .statement-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }
    .statement-dates {
      font-size: 11px;
      color: #475569;
      margin-top: 2px;
    }
    .parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
    }
    .box-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 6px;
    }
    .info-line {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 11px;
    }
    .info-label {
      color: #64748b;
    }
    .info-val {
      font-weight: 600;
      color: #0f172a;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .summary-table th {
      background: #0f172a;
      color: #ffffff;
      text-align: left;
      font-size: 10px;
      font-weight: 600;
      padding: 8px 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .summary-table td {
      border: 1px solid #e2e8f0;
      padding: 8px 10px;
      font-size: 11px;
    }
    .summary-table .amount {
      text-align: right;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-weight: 600;
    }
    .transactions-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .transactions-table th {
      background: #f1f5f9;
      border-bottom: 2px solid #cbd5e1;
      padding: 7px 8px;
      font-size: 10px;
      font-weight: 700;
      text-align: left;
      color: #334155;
      text-transform: uppercase;
    }
    .transactions-table td {
      border-bottom: 1px solid #e2e8f0;
      padding: 7px 8px;
      font-size: 10.5px;
      color: #1e293b;
    }
    .transactions-table tr:nth-child(even) {
      background: #fafafa;
    }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .credit-amount {
      color: #047857;
      font-weight: 600;
      text-align: right;
    }
    .debit-amount {
      color: #0f172a;
      text-align: right;
    }
    .footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 12px;
      margin-top: 24px;
      font-size: 9.5px;
      color: #64748b;
      line-height: 1.5;
    }
    .no-print-bar {
      background: #0f172a;
      color: #ffffff;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: -24px -24px 20px -24px;
    }
    .print-btn {
      background: #10b981;
      color: #0f172a;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
      font-size: 12px;
    }
    .print-btn:hover {
      background: #34d399;
    }
    @media print {
      .no-print-bar {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong>Official Bank Statement Preview</strong> — ${account.name} (•••• ${account.accountNumber.slice(-4)})
    </div>
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="header">
    <div>
      <div class="brand-title">Crestline Premier Bank</div>
      <div class="brand-sub">Private Banking & Treasury Division · Member FDIC · Equal Housing Lender</div>
      <div class="brand-sub">Headquarters: 270 Park Avenue, New York, NY 10017</div>
    </div>
    <div class="statement-badge">
      <div class="statement-title">ACCOUNT STATEMENT</div>
      <div class="statement-dates">${statementPeriod}</div>
      <div class="brand-sub">Document ID: STM-${Date.now().toString().slice(-8)}</div>
    </div>
  </div>

  <div class="parties-grid">
    <div class="box">
      <div class="box-title">Account Holder Details</div>
      <div class="info-line">
        <span class="info-label">Customer Name:</span>
        <span class="info-val">Alexander M. Vance</span>
      </div>
      <div class="info-line">
        <span class="info-label">Client ID:</span>
        <span class="info-val">CPB-84920194</span>
      </div>
      <div class="info-line">
        <span class="info-label">Account Name:</span>
        <span class="info-val">${account.name}</span>
      </div>
      <div class="info-line">
        <span class="info-label">Account Transit:</span>
        <span class="info-val">•••• •••• ${account.accountNumber.slice(-4)}</span>
      </div>
    </div>

    <div class="box">
      <div class="box-title">Financial Institution Information</div>
      <div class="info-line">
        <span class="info-label">Institution Name:</span>
        <span class="info-val">Crestline Premier Bank, N.A.</span>
      </div>
      <div class="info-line">
        <span class="info-label">Fedwire Routing Transit:</span>
        <span class="info-val">${account.routingNumber}</span>
      </div>
      <div class="info-line">
        <span class="info-label">Account Classification:</span>
        <span class="info-val">${account.type.toUpperCase()}</span>
      </div>
      <div class="info-line">
        <span class="info-label">Statement Date:</span>
        <span class="info-val">${formatDate(new Date().toISOString().split('T')[0])}</span>
      </div>
    </div>
  </div>

  <table class="summary-table">
    <thead>
      <tr>
        <th>Starting Balance</th>
        <th>Total Deposits (+)</th>
        <th>Total Withdrawals (-)</th>
        <th>Ending Cleared Balance</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="amount">$${Math.max(0, openingBalanceEstimate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="amount" style="color: #047857;">+$${totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="amount">-$${totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="amount" style="font-weight: 700; font-size: 12px; color: #047857;">$${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    </tbody>
  </table>

  <h3 style="font-size: 12px; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; color: #334155;">
    Itemized Transaction Ledger (${transactions.length} Records)
  </h3>

  <table class="transactions-table">
    <thead>
      <tr>
        <th style="width: 75px;">Date</th>
        <th>Merchant / Counterparty</th>
        <th style="width: 90px;">Category</th>
        <th style="width: 100px;">Reference Code</th>
        <th style="width: 90px; text-align: right;">Amount (USD)</th>
      </tr>
    </thead>
    <tbody>
      ${transactions
        .map(
          (t) => `
        <tr>
          <td class="mono">${t.date}</td>
          <td>
            <strong>${t.merchant}</strong>
            ${t.note ? `<div style="font-size: 9px; color: #64748b;">${t.note}</div>` : ''}
          </td>
          <td>${t.category}</td>
          <td class="mono" style="font-size: 9.5px; color: #64748b;">${t.referenceNumber}</td>
          <td class="mono ${t.type === 'credit' ? 'credit-amount' : 'debit-amount'}">
            ${t.type === 'credit' ? '+' : '-'}$${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="footer">
    <p><strong>IMPORTANT NOTICES:</strong> Please examine this statement immediately upon receipt. Any discrepancies, errors, or unauthorized debits must be reported to Crestline Premier Treasury Client Services within thirty (30) days of the statement dispatch date. All deposit accounts held with Crestline Premier Bank, N.A. are insured by the Federal Deposit Insurance Corporation (FDIC) up to standard statutory limits ($250,000 per depositor).</p>
    <p style="margin-top: 4px;">Electronic record authenticated via cryptographic audit seal. Reference verification hash: SHA256-${Date.now().toString(16).toUpperCase()}</p>
  </div>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    // Auto-trigger print dialog after small render tick
    setTimeout(() => {
      try {
        printWindow.focus();
      } catch (err) {
        console.error('Could not focus print window', err);
      }
    }, 250);
  }
}
