/**
 * Monetary & Display Formatters for CoinCraft
 */

// Formats number to Indian Rupee (₹) format with 2 decimals
export const formatCurrency = (amount, currency = 'INR') => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0.00';
  }
  
  const num = Number(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  return formatted;
};

// Masks account number e.g. "SB1234567890" -> "•••• •••• 7890"
export const maskAccountNumber = (accountNumber) => {
  if (!accountNumber) return '•••• •••• ••••';
  const str = String(accountNumber);
  if (str.length <= 4) return str;
  const last4 = str.slice(-4);
  return `•••• •••• ${last4}`;
};

// Formats ISO date to readable string "14 Oct 2026, 03:30 PM"
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return dateStr;
  }
};

// Formats ISO date to readable date only "14 Oct 2026"
export const formatDateOnly = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
};

// Get initials from user name (e.g. "Ayan Shaikh" -> "AS")
export const getInitials = (firstName = '', lastName = '') => {
  const f = firstName ? firstName[0].toUpperCase() : '';
  const l = lastName ? lastName[0].toUpperCase() : '';
  return `${f}${l}` || 'SB';
};
