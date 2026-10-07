const pad = (n: number) => String(n).padStart(2, '0');

/** 24-hour time, e.g. 08:30 */
export const time = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const money = (n: number) => '$' + (Math.round(n * 100) / 100).toFixed(2);

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Today · Wed, 7 Oct" or "Thu, 8 Oct" */
export function dayLabel(d: Date): string {
  const label = `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return d.toDateString() === new Date().toDateString() ? `Today · ${label}` : label;
}

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

/** Unit shown next to a quantity, from the Charge Unit__c picklist value. */
export const unitLabel: Record<string, string> = { Hour: 'h', Each: 'pcs', Km: 'km', Fixed: '' };
