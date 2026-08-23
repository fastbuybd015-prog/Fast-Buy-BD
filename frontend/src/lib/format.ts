export const TAKA = '৳';

/** Formats a BDT amount, e.g. 1450 → "৳1,450". */
export function formatPrice(amount: number): string {
  return `${TAKA}${Math.round(amount).toLocaleString('en-US')}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** "3h 42m left" style countdown used by the trial badge. */
export function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return 'Expired';

  const totalMinutes = Math.floor(msRemaining / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = Math.floor((msRemaining % 60000) / 1000);

  if (hours > 0) return `${hours}h ${minutes}m left`;
  if (minutes > 0) return `${minutes}m ${seconds}s left`;
  return `${seconds}s left`;
}

export function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
