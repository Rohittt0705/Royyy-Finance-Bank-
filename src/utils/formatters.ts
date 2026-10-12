export function formatCurrency(
  amount: number,
  privacyMode: boolean = false,
  showSign: boolean = false
): string {
  if (privacyMode) {
    return '••••••••';
  }
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (showSign && amount > 0) {
    return `+${formatted}`;
  }
  if (amount < 0) {
    return `-${formatted}`;
  }
  return formatted;
}

export function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function formatDateTime(isoStr: string): string {
  try {
    const date = new Date(isoStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return isoStr;
  }
}

export function maskAccountNumber(acc: string, reveal: boolean = false): string {
  if (reveal || !acc) return acc;
  return `•••• ${acc.slice(-4)}`;
}

export function formatCardNumber(card: string, reveal: boolean = false): string {
  if (!card) return '•••• •••• •••• ••••';
  if (reveal) return card;
  const parts = card.split(' ');
  if (parts.length === 4) {
    return `•••• •••• •••• ${parts[3]}`;
  }
  return `•••• •••• •••• ${card.slice(-4)}`;
}
