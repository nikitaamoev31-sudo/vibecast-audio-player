import { el } from 'redom';
import { tag } from '../utils/dom';
import { library } from '../core/library';
import { session } from '../core/session';
import { durationToSeconds, formatTime } from '../utils/format';

/** Профиль: аватар-заглушка, имя и немного статистики по избранному. */
export class ProfilePage {
  readonly el: HTMLElement;
  private readonly avatar = el('div.profile__avatar', { 'aria-hidden': 'true' });
  private readonly name = el('h1.profile__name');
  private readonly favorites = el('dd.profile__value');
  private readonly duration = el('dd.profile__value');
  private readonly total = el('dd.profile__value');

  constructor() {
    const logout = tag('button', 'btn btn--ghost', { type: 'button' }, 'Выйти из аккаунта');
    this.el = el(
      'section.profile',
      el(
        'div.profile__card',
        this.avatar,
        this.name,
        el('p.profile__role', 'Слушатель VibeCast Studio'),
        el(
          'dl.profile__stats',
          el('div.profile__stat', el('dt.profile__label', 'В избранном'), this.favorites),
          el('div.profile__stat', el('dt.profile__label', 'Время избранного'), this.duration),
          el('div.profile__stat', el('dt.profile__label', 'Треков в каталоге'), this.total),
        ),
        el('div.profile__actions', tag('a', 'btn', { href: '#/favorites' }, 'Открыть избранное'), logout),
      ),
    );

    logout.addEventListener('click', () => session.end());
  }

  render(): void {
    const username = session.username ?? 'Гость';
    this.avatar.textContent = username[0].toUpperCase();
    this.name.textContent = username;
    const favorites = library.favorites;
    this.favorites.textContent = String(favorites.length);
    this.duration.textContent = formatTime(favorites.reduce((sum, track) => sum + durationToSeconds(track.duration), 0));
    this.total.textContent = String(library.all.length);
  }
}
