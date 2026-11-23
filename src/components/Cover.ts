import { el } from 'redom';
import { coverHue } from '../utils/format';
import type { Track } from '../types';

/** Обложка-заглушка: API не отдаёт картинок, поэтому рисуем градиент с инициалами трека. */
export function cover(track: Track, modifier = ''): HTMLElement {
  const hue = coverHue(track.id);
  const initials = track.title
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return el(
    `div.cover${modifier ? `.cover--${modifier}` : ''}`,
    {
      style: `--cover-a: hsl(${hue} 70% 45%); --cover-b: hsl(${(hue + 60) % 360} 75% 25%)`,
      'aria-hidden': 'true',
    },
    el('span.cover__text', initials),
  );
}
