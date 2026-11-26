import { el, setChildren } from 'redom';
import { tag } from '../utils/dom';
import { cover } from './Cover';
import { icon } from './icons';
import { openTrackCard } from './TrackCard';
import { library } from '../core/library';
import { player } from '../core/player';
import { history } from '../core/history';
import { durationToSeconds, formatAddedAt, formatTime } from '../utils/format';
import type { Track } from '../types';

export interface RowContext {
  /** Список, из которого запускается трек, — он становится очередью плеера. */
  queue: readonly Track[];
}

/** Строка трека. На телефоне та же разметка превращается в карточку через CSS. */
export class TrackRow {
  readonly el: HTMLElement;
  private readonly heart: HTMLButtonElement;
  private readonly number: HTMLElement;
  private readonly added = el('span.track__added');
  private track: Track | null = null;
  private context: RowContext = { queue: [] };

  constructor() {
    this.number = el('span.track__number');
    this.heart = tag('button', 'track__heart', { type: 'button' }, icon('heart'));
    this.el = el('li.track');

    this.heart.addEventListener('click', (event) => {
      event.stopPropagation();
      if (this.track) void library.toggleFavorite(this.track.id);
    });
    this.el.addEventListener('click', () => {
      if (this.track) player.play(this.track, this.context.queue);
    });
    this.el.addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target === this.el && this.track) {
        event.preventDefault();
        player.play(this.track, this.context.queue);
      }
    });
  }

  /** Вызывается RE:DOM list() при отрисовке и обновлении списка. */
  update(track: Track, index: number, _items: Track[], context: RowContext & { offset: number }): void {
    const sameTrack = this.track?.id === track.id;
    this.track = track;
    this.context = context;
    this.number.textContent = String(context.offset + index + 1);

    if (!sameTrack) this.render(track);
    this.refresh();
  }

  /** Обновляет состояние без пересоздания разметки: избранное и «сейчас играет». */
  refresh(): void {
    if (!this.track) return;
    const favorite = library.isFavorite(this.track.id);
    this.heart.classList.toggle('track__heart--active', favorite);
    this.heart.setAttribute('aria-pressed', String(favorite));
    this.heart.setAttribute('aria-label', favorite ? 'Убрать из избранного' : 'Добавить в избранное');
    this.added.textContent = formatAddedAt(history.addedAt(this.track.id, favorite));

    const current = player.current?.id === this.track.id;
    this.el.classList.toggle('track--current', current);
    this.el.classList.toggle('track--playing', current && player.playing);
  }

  private render(track: Track): void {
    const more = tag('button', 'track__more',
      { type: 'button', 'aria-label': `Подробнее о треке ${track.title}` },
      icon('more'),
    );
    more.addEventListener('click', (event) => {
      event.stopPropagation();
      openTrackCard(track, this.context.queue);
    });

    this.el.setAttribute('tabindex', '0');
    this.el.setAttribute('aria-label', `${track.title} — ${track.artist}`);
    setChildren(this.el, [
      this.number,
      el(
        'div.track__main',
        cover(track),
        el('div.track__info', el('span.track__title', track.title), el('span.track__artist', track.artist)),
      ),
      // В API нет альбома: каждый трек выпущен синглом, поэтому альбом совпадает с названием
      el('span.track__album', { title: track.title }, track.title),
      this.added,
      this.heart,
      el('span.track__duration', formatTime(durationToSeconds(track.duration))),
      more,
    ]);
  }
}
