import { el } from 'redom';
import { tag } from '../utils/dom';
import { icon } from './icons';
import type { RouteName } from '../types';

const ITEMS: { route: RouteName; label: string; short: string }[] = [
  { route: 'favorites', label: 'Избранное', short: 'Избранное' },
  { route: 'tracks', label: 'Аудиокомпозиции', short: 'Аудиокомпозиции' },
];

/** Боковое меню на десктопе и переключатель-«таблетки» на телефоне — один компонент, разный CSS. */
export class Navigation {
  readonly el: HTMLElement;
  private readonly links: HTMLAnchorElement[];

  constructor() {
    this.links = ITEMS.map(({ route, label }) =>
      tag('a', 'nav__link', { href: `#/${route}`, 'data-route': route }, icon('note', 'nav__icon'), el('span', label)),
    );
    this.el = el('nav.nav', { 'aria-label': 'Разделы' }, this.links);
  }

  setActive(route: RouteName): void {
    this.links.forEach((link) => {
      const active = link.dataset.route === route;
      link.classList.toggle('nav__link--active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }
}
