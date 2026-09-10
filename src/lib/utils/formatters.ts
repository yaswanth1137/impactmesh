/**
 * IMPACTMESH - Core Formatting Utilities
 */

export function formatCurrency(
  amount: number,
  currency = 'INR',
  compact = false
): string {
  if (compact && Math.abs(amount) >= 100000) {
    // Format Indian Lakhs / Crores if currency is INR
    if (currency === 'INR') {
      if (Math.abs(amount) >= 10000000) {
        return `₹${(amount / 10000000).toFixed(2)} Cr`;
      }
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function formatHours(hours: number): string {
  return `${hours.toLocaleString()} hrs`;
}

export function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return isoString;
  }
}
