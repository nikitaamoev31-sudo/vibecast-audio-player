import { setChildren, svg } from 'redom';

const PATHS = {
  heart:
    'M12 21s-7.5-4.6-10-9.2C.3 8.4 2.2 4 6.3 4c2.3 0 3.7 1.3 4.7 2.7C12 5.3 13.4 4 15.7 4 19.8 4 21.7 8.4 20 11.8 17.5 16.4 12 21 12 21z',
  play: 'M8 5.5v13a.8.8 0 0 0 1.2.7l10.4-6.5a.8.8 0 0 0 0-1.4L9.2 4.8A.8.8 0 0 0 8 5.5z',
  pause: 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z',
  next: 'M6 5.5v13a.7.7 0 0 0 1.1.6L16 13v5.5h2v-13h-2V11L7.1 4.9A.7.7 0 0 0 6 5.5z',
  prev: 'M18 5.5v13a.7.7 0 0 1-1.1.6L8 13v5.5H6v-13h2V11l8.9-6.1a.7.7 0 0 1 1.1.6z',
  shuffle: 'M4 7h3.5c1.6 0 2.6.8 3.5 2l3 4.5c.8 1.2 1.6 2 3.2 2H20m0 0-2.5-2.5M20 15.5 17.5 18M4 15.5h3.5c1 0 1.7-.4 2.3-1M20 7h-2.8c-1 0-1.8.4-2.4 1.1M20 7l-2.5-2.5M20 7l-2.5 2.5',
  repeat: 'M5 11V9.5A2.5 2.5 0 0 1 7.5 7H19m0 0-3-3m3 3-3 3M19 13v1.5a2.5 2.5 0 0 1-2.5 2.5H5m0 0 3 3m-3-3 3-3',
  volume: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11',
  mute: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9.5l5 5m0-5-5 5',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5 20 20',
  note: 'M9 17.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zm0 0V6l11-2v11.5M20 15.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM9 9.5l11-2',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  calendar: 'M5 6.5h14v13H5zM5 10.5h14M9 4.5v4M15 4.5v4',
  clock: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM12 7.5V12l3 2',
  chevron: 'M9.5 6l6 6-6 6',
  close: 'M6 6l12 12M18 6 6 18',
  back10: 'M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4v3.5H8',
  forward10: 'M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4v3.5H16',
} as const;

export type IconName = keyof typeof PATHS;

const FILLED: readonly IconName[] = ['heart', 'play', 'pause', 'next', 'prev'];

/** SVG-иконка; заливка или контур зависят от типа иконки. */
export function icon(name: IconName, className = ''): SVGElement {
  const filled = FILLED.includes(name);
  const node = svg(
    'svg',
    { viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' },
    svg('path', {
      d: PATHS[name],
      fill: filled ? 'currentColor' : 'none',
      stroke: filled ? 'none' : 'currentColor',
      'stroke-width': name === 'more' ? 3 : 1.6,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }),
  );
  // У SVG-элементов в RE:DOM несколько классов через пробел не передать, поэтому — атрибутом
  node.setAttribute('class', className.split(' ').includes('icon') ? className : `icon ${className}`.trim());
  return node;
}

export function setIcon(target: SVGElement, name: IconName): void {
  const next = icon(name, target.getAttribute('class') ?? '');
  setChildren(target, Array.from(next.childNodes));
}
