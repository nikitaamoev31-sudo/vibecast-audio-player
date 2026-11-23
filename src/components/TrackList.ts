import { el, list, setChildren, type List } from 'redom';
import { tag } from '../utils/dom';
import { icon } from './icons';
import { TrackRow } from './TrackRow';
import type { Track } from '../types';

const PAGE_SIZE = 8;
const mobileQuery = window.matchMedia('(max-width: 767px)');

/**
 * Список треков с пагинацией.
 * Десктоп — классические страницы, телефон — подгрузка следующей порции
 * при прокрутке к концу списка (IntersectionObserver).
 */
export class TrackList {
  readonly el: HTMLElement;
  private readonly title = el('h1.tracks__title');
  private readonly rows: List & { views: TrackRow[] };
  private readonly pager = el('nav.pager', { 'aria-label': 'Страницы списка' });
  private readonly sentinel = el('div.tracks__sentinel', { 'aria-hidden': 'true' });
  private readonly empty = el('p.tracks__empty');
  private readonly observer: IntersectionObserver;
  private items: Track[] = [];
  private page = 1;
  private shown = PAGE_SIZE;

  constructor() {
    this.rows = list('ol.tracks__list', TrackRow) as List & { views: TrackRow[] };
    this.el = el(
      'section.tracks',
      this.title,
      el(
        'div.tracks__head',
        { 'aria-hidden': 'true' },
        el('span', '№'),
        el('span', 'Название'),
        el('span.tracks__head-size', 'Размер'),
        el('span'),
        el('span.tracks__head-time', icon('clock', 'icon icon--small')),
        el('span'),
      ),
      this.rows,
      this.empty,
      this.sentinel,
      this.pager,
    );

    this.observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting) && this.shown < this.items.length) {
        this.shown += PAGE_SIZE;
        this.render();
      }
    });
    this.observer.observe(this.sentinel);
    mobileQuery.addEventListener('change', () => this.render());
  }

  show(title: string, items: Track[], emptyText: string): void {
    this.title.textContent = title;
    this.empty.textContent = emptyText;
    this.items = items;
    this.page = 1;
    this.shown = PAGE_SIZE;
    this.render();
  }

  /** Перерисовка состояния строк (избранное, текущий трек) без пересоздания списка. */
  refresh(): void {
    this.rows.views.forEach((row) => row.refresh());
  }

  private render(): void {
    const mobile = mobileQuery.matches;
    const pages = Math.max(1, Math.ceil(this.items.length / PAGE_SIZE));
    this.page = Math.min(this.page, pages);

    const offset = mobile ? 0 : (this.page - 1) * PAGE_SIZE;
    const visible = mobile ? this.items.slice(0, this.shown) : this.items.slice(offset, offset + PAGE_SIZE);

    this.rows.update(visible, { queue: this.items, offset });
    this.empty.hidden = this.items.length > 0;
    this.renderPager(mobile ? 1 : pages);
  }

  private renderPager(pages: number): void {
    this.pager.hidden = pages < 2;
    if (pages < 2) return;
    const buttons = Array.from({ length: pages }, (_, i) => {
      const page = i + 1;
      const button = tag('button', 'pager__button',
        { type: 'button', 'aria-label': `Страница ${page}` },
        String(page),
      );
      if (page === this.page) {
        button.classList.add('pager__button--active');
        button.setAttribute('aria-current', 'page');
      }
      button.addEventListener('click', () => {
        this.page = page;
        this.render();
        this.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return button;
    });
    setChildren(this.pager, buttons);
  }
}
