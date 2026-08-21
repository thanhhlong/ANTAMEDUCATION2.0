export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatShortCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} tr`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)} k`;
  }
  return `${amount} ₫`;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateTimeString?: string): string {
  if (!dateTimeString) return '-';
  try {
    const d = new Date(dateTimeString);
    if (isNaN(d.getTime())) return dateTimeString;
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateTimeString;
  }
}

export function getDayName(dayNumber: number): string {
  switch (dayNumber) {
    case 2:
      return 'Thứ 2';
    case 3:
      return 'Thứ 3';
    case 4:
      return 'Thứ 4';
    case 5:
      return 'Thứ 5';
    case 6:
      return 'Thứ 6';
    case 7:
      return 'Thứ 7';
    case 8:
      return 'Chủ nhật';
    default:
      return `Thứ ${dayNumber}`;
  }
}

export function getShiftTime(shiftNumber: number): string {
  switch (shiftNumber) {
    case 1:
      return 'Ca 1 (14:00 - 15:30)';
    case 2:
      return 'Ca 2 (15:45 - 17:15)';
    case 3:
      return 'Ca 3 (17:30 - 19:00)';
    case 4:
      return 'Ca 4 (19:15 - 20:45)';
    default:
      return `Ca ${shiftNumber}`;
  }
}
