/** Длительность из API приходит в минутах дробью: 4.24 → 254 секунды. */
export const durationToSeconds = (minutes: number): number => Math.round(minutes * 60);

export function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** Цвет обложки-заглушки стабилен для каждого трека. */
export function coverHue(id: number): number {
  return (id * 47) % 360;
}

export function formatSize(megabytes: number): string {
  return `${megabytes.toFixed(1).replace('.', ',')} МБ`;
}

function plural(count: number, forms: [string, string, string]): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

const DAY = 24 * 60 * 60 * 1000;

/** Относительная дата как в макете: «сегодня», «вчера», «6 дней назад». */
export function formatAddedAt(timestamp: number | null, now = Date.now()): string {
  if (timestamp === null) return '—';
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const days = Math.max(0, Math.ceil((startOfToday - timestamp) / DAY));
  if (days === 0) return 'сегодня';
  if (days === 1) return 'вчера';
  return `${days} ${plural(days, ['день', 'дня', 'дней'])} назад`;
}
