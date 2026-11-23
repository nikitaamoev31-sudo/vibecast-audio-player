import { el } from 'redom';
import { tag } from '../utils/dom';
import { icon } from './icons';
import { router } from '../core/router';
import { session } from '../core/session';
import { Emitter } from '../core/emitter';

interface HeaderEvents {
  search: string;
}

export class Header extends Emitter<HeaderEvents> {
  readonly el: HTMLElement;
  private readonly input: HTMLInputElement;
  private readonly name = el('span.user__name');
  private readonly avatar = el('span.user__avatar');

  constructor() {
    super();
    this.input = tag('input', 'search__input', {
      type: 'search',
      placeholder: 'Что будем искать?',
      'aria-label': 'Поиск по названию и исполнителю',
    });
    const userButton = tag('button', 'user',
      { type: 'button', 'aria-label': 'Открыть профиль' },
      this.avatar,
      this.name,
      icon('chevron', 'user__chevron'),
    );

    this.el = el(
      'header.header',
      tag('a', 'logo',
        { href: '#/tracks', 'aria-label': 'VibeCast Studio — на главную' },
        el('span.logo__mark'),
        el('span.logo__text', 'VibeCast Studio'),
      ),
      el('label.search', icon('search', 'search__icon'), this.input),
      userButton,
    );

    this.input.addEventListener('input', () => this.emit('search', this.input.value.trim().toLowerCase()));
    userButton.addEventListener('click', () => router.go('profile'));
    this.update();
  }

  update(): void {
    const username = session.username ?? '';
    this.name.textContent = username;
    this.avatar.textContent = (username || '?')[0].toUpperCase();
  }

  clearSearch(): void {
    this.input.value = '';
  }
}
