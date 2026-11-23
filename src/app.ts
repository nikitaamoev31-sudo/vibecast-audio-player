import { el, setChildren } from 'redom';
import { tag } from './utils/dom';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { PlayerBar } from './components/PlayerBar';
import { TrackList } from './components/TrackList';
import { toast } from './components/Toast';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';
import { library } from './core/library';
import { player, SEEK_STEP } from './core/player';
import { router } from './core/router';
import { session } from './core/session';
import type { RouteName, Track } from './types';

/** Корневой компонент: собирает экраны и связывает их с роутером и состоянием. */
export class App {
  private readonly root: HTMLElement;
  private readonly header = new Header();
  private readonly navigation = new Navigation();
  private readonly trackList = new TrackList();
  private readonly profile = new ProfilePage();
  private readonly playerBar = new PlayerBar();
  private readonly auth = new AuthPage();
  private readonly content = el('main.layout__content', { id: 'content' });
  private readonly shell: HTMLElement;
  private query = '';

  constructor(root: HTMLElement) {
    this.root = root;
    this.shell = el(
      'div.layout',
      tag('a', 'skip-link', { href: '#content' }, 'Перейти к содержимому'),
      this.header,
      el('aside.layout__sidebar', this.navigation),
      this.content,
      this.playerBar,
    );

    this.header.on('search', (query) => {
      this.query = query;
      if (router.current === 'profile') router.go('tracks');
      else void this.renderRoute();
    });
    router.on('change', () => void this.renderRoute());
    session.on('change', (username) => {
      if (!username) router.go('login');
    });
    library.on('favorites', () => {
      // В избранном снятый трек должен исчезнуть, в общем списке — только смениться сердечко
      if (router.current === 'favorites') void this.renderRoute();
      else this.trackList.refresh();
      if (router.current === 'profile') this.profile.render();
    });
    library.on('error', (message) => toast(message, 'error'));
    player.on('track', () => this.trackList.refresh());
    player.on('state', () => this.trackList.refresh());

    this.bindHotkeys();
    void this.renderRoute();
  }

  private async renderRoute(): Promise<void> {
    const route = router.current;

    if (!session.isAuthorized && !router.isPublic(route)) {
      router.go('login');
      return;
    }
    if (session.isAuthorized && router.isPublic(route)) {
      router.go('tracks');
      return;
    }

    if (router.isPublic(route)) {
      this.auth.setMode(route === 'register' ? 'register' : 'login');
      setChildren(this.root, [this.auth]);
      document.title = `${route === 'register' ? 'Регистрация' : 'Вход'} — VibeCast Studio`;
      return;
    }

    if (this.root.firstChild !== this.shell) {
      this.header.update();
      setChildren(this.root, [this.shell]);
    }
    this.navigation.setActive(route);

    try {
      await library.load();
    } catch (error) {
      setChildren(this.content, [el('p.layout__error', error instanceof Error ? error.message : 'Не удалось загрузить треки')]);
      return;
    }
    this.renderContent(route);
  }

  private renderContent(route: RouteName): void {
    if (route === 'profile') {
      this.profile.render();
      setChildren(this.content, [this.profile]);
      document.title = 'Профиль — VibeCast Studio';
      return;
    }

    const favorites = route === 'favorites';
    const source = favorites ? library.favorites : [...library.all];
    const items = this.filter(source);
    const title = this.query ? `Результаты поиска: «${this.query}»` : favorites ? 'Избранное' : 'Аудиофайлы и треки';
    const emptyText = this.query
      ? 'Ничего не нашлось. Попробуйте другое название или исполнителя.'
      : 'Здесь пока пусто — отметьте сердечком треки, которые понравились.';

    this.trackList.show(title, items, emptyText);
    if (this.content.firstChild !== this.trackList.el) setChildren(this.content, [this.trackList]);
    document.title = `${favorites ? 'Избранное' : 'Аудиокомпозиции'} — VibeCast Studio`;
  }

  private filter(tracks: Track[]): Track[] {
    if (!this.query) return tracks;
    return tracks.filter((track) => `${track.title} ${track.artist}`.toLowerCase().includes(this.query));
  }

  /** Пробел — пауза, стрелки — перемотка на 10 секунд, Shift+стрелки — соседний трек. */
  private bindHotkeys(): void {
    document.addEventListener('keydown', (event) => {
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, select, button, a, [role="dialog"]') || !player.current) return;
      if (event.code === 'Space') {
        event.preventDefault();
        player.toggle();
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const forward = event.key === 'ArrowRight';
        if (event.shiftKey) {
          if (forward) player.next();
          else player.previous();
        } else player.skip(forward ? SEEK_STEP : -SEEK_STEP);
      }
    });
  }
}
