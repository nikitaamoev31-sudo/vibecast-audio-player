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
