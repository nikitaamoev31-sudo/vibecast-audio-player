import { el, mount, unmount } from 'redom';
import { tag } from '../utils/dom';
import { cover } from './Cover';
import { icon } from './icons';
import { library } from '../core/library';
import { player } from '../core/player';
import { durationToSeconds, formatSize, formatTime } from '../utils/format';
import type { Track } from '../types';

/** Модальная карточка трека с основной информацией и действиями. */
export function openTrackCard(track: Track, queue: readonly Track[]): void {
  const favoriteButton = tag('button', 'btn btn--ghost', { type: 'button' });
  const renderFavorite = () => {
    favoriteButton.textContent = library.isFavorite(track.id) ? 'Убрать из избранного' : 'В избранное';
  };
  renderFavorite();

  const closeButton = tag('button', 'modal__close', { type: 'button', 'aria-label': 'Закрыть' }, icon('close'));
  const playButton = tag('button', 'btn', { type: 'button' }, 'Слушать');

  const dialog = el(
    'div.modal',
    { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'track-card-title' },
    el(
      'div.modal__window.track-card',
      closeButton,
      cover(track, 'large'),
      el('h2.track-card__title', { id: 'track-card-title' }, track.title),
      el('p.track-card__artist', track.artist),
      el(
        'dl.track-card__meta',
        el('dt', 'Длительность'),
        el('dd', formatTime(durationToSeconds(track.duration))),
        el('dt', 'Размер файла'),
        el('dd', formatSize(track.size_mb)),
        el('dt', 'Номер в каталоге'),
        el('dd', `#${track.id}`),
      ),
      el('div.track-card__actions', playButton, favoriteButton),
    ),
  );

  const unsubscribe = library.on('favorites', renderFavorite);
  const close = () => {
    unsubscribe();
    document.removeEventListener('keydown', onKey);
    unmount(document.body, dialog);
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close();
  };

  closeButton.addEventListener('click', close);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });
  document.addEventListener('keydown', onKey);
  playButton.addEventListener('click', () => {
    player.play(track, queue);
    close();
  });
  favoriteButton.addEventListener('click', () => void library.toggleFavorite(track.id));

  mount(document.body, dialog);
  playButton.focus();
}
