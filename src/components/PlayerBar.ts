import { el, mount, setChildren } from 'redom';
import { tag } from '../utils/dom';
import { cover } from './Cover';
import { icon, setIcon } from './icons';
import { library } from '../core/library';
import { player, SEEK_STEP } from '../core/player';
import { formatTime } from '../utils/format';

/** Нижняя панель плеера: обложка, управление, прогресс и громкость. */
export class PlayerBar {
  readonly el: HTMLElement;
  private readonly coverSlot = el('div.player__cover');
  private readonly title = el('span.player__title', 'Выберите трек');
  private readonly artist = el('span.player__artist', 'Нажмите на любую композицию в списке');
  private readonly heart = tag('button', 'player__heart', { type: 'button', 'aria-label': 'Добавить в избранное' }, icon('heart'));
  private readonly playIcon = icon('play', 'icon icon--play');
  private readonly playButton = tag('button', 'player__play', { type: 'button', 'aria-label': 'Воспроизвести' }, this.playIcon);
  private readonly shuffleButton = this.control('shuffle', 'Перемешать');
  private readonly repeatButton = this.control('repeat', 'Повтор');
  private readonly repeatBadge = el('span.player__badge', '1');
  private readonly current = el('span.player__time', '0:00');
  private readonly total = el('span.player__time', '0:00');
  private readonly progress = tag('input', 'range player__progress', {
    type: 'range',
    min: 0,
    max: 0,
    step: 1,
    value: 0,
    'aria-label': 'Позиция воспроизведения. Стрелки влево и вправо — перемотка на 10 секунд',
  });
  private readonly volume = tag('input', 'range player__volume', {
    type: 'range',
    min: 0,
    max: 1,
    step: 0.01,
    'aria-label': 'Громкость',
  });
  private readonly muteIcon = icon('volume');
  private seeking = false;

  constructor() {
    const prev = this.control('prev', 'Предыдущий трек');
    const next = this.control('next', 'Следующий трек');
    const back = this.control('back10', `Назад на ${SEEK_STEP} секунд`, 'player__skip');
    const forward = this.control('forward10', `Вперёд на ${SEEK_STEP} секунд`, 'player__skip');
    const mute = tag('button', 'player__control player__mute', { type: 'button', 'aria-label': 'Без звука' }, this.muteIcon);
    mount(this.repeatButton, this.repeatBadge);

    this.el = el(
      'footer.player.player--empty',
      el(
        'div.player__now',
        this.coverSlot,
        el('div.player__info', el('div.player__line', this.title, this.heart), this.artist),
      ),
      el(
        'div.player__center',
        el('div.player__controls', this.shuffleButton, back, prev, this.playButton, next, forward, this.repeatButton),
        el('div.player__timeline', this.current, this.progress, this.total),
      ),
      el('div.player__sound', mute, this.volume),
    );

    this.volume.value = String(player.volume);
    this.paintRange(this.volume);

    this.playButton.addEventListener('click', () => player.toggle());
    prev.addEventListener('click', () => player.previous());
    next.addEventListener('click', () => player.next());
    back.addEventListener('click', () => player.skip(-SEEK_STEP));
    forward.addEventListener('click', () => player.skip(SEEK_STEP));
    this.shuffleButton.addEventListener('click', () => player.toggleShuffle());
    this.repeatButton.addEventListener('click', () => player.cycleRepeat());
    this.heart.addEventListener('click', () => {
      if (player.current) void library.toggleFavorite(player.current.id);
    });

    // Перемотка: клик или перетаскивание по шкале, колесо мыши ±10 секунд
    this.progress.addEventListener('input', () => {
      this.seeking = true;
      this.current.textContent = formatTime(Number(this.progress.value));
      this.paintRange(this.progress);
    });
    this.progress.addEventListener('change', () => {
      this.seeking = false;
      player.seek(Number(this.progress.value));
    });
    this.progress.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        player.skip(event.key === 'ArrowLeft' ? -SEEK_STEP : SEEK_STEP);
      }
    });
    this.progress.addEventListener(
      'wheel',
      (event) => {
        event.preventDefault();
        player.skip(event.deltaY > 0 ? -SEEK_STEP : SEEK_STEP);
      },
      { passive: false },
    );

    let lastVolume = player.volume || 0.7;
    this.volume.addEventListener('input', () => player.setVolume(Number(this.volume.value)));
    mute.addEventListener('click', () => {
      if (player.volume > 0) {
        lastVolume = player.volume;
        player.setVolume(0);
      } else player.setVolume(lastVolume);
    });

    this.subscribe();
  }

  private control(name: Parameters<typeof icon>[0], label: string, extra = ''): HTMLButtonElement {
    const button = tag('button', `player__control ${extra}`, { type: 'button', 'aria-label': label, title: label }, icon(name));
    if (extra === 'player__skip') mount(button, el('span.player__ten', { 'aria-hidden': 'true' }, '10'));
    return button;
  }

  /** Закрашивает пройденную часть шкалы через CSS-переменную. */
  private paintRange(input: HTMLInputElement): void {
    const max = Number(input.max) || 1;
    input.style.setProperty('--fill', `${(Number(input.value) / max) * 100}%`);
  }

  private renderHeart(): void {
    const favorite = player.current ? library.isFavorite(player.current.id) : false;
    this.heart.classList.toggle('player__heart--active', favorite);
    this.heart.setAttribute('aria-pressed', String(favorite));
    this.heart.setAttribute('aria-label', favorite ? 'Убрать из избранного' : 'Добавить в избранное');
  }

  private subscribe(): void {
    player.on('track', (track) => {
      this.el.classList.toggle('player--empty', !track);
      if (!track) return;
      setChildren(this.coverSlot, [cover(track, 'player')]);
      this.title.textContent = track.title;
      this.artist.textContent = track.artist;
      this.renderHeart();
    });

    player.on('state', ({ playing }) => {
      setIcon(this.playIcon, playing ? 'pause' : 'play');
      this.playButton.setAttribute('aria-label', playing ? 'Пауза' : 'Воспроизвести');
    });

    player.on('time', ({ current, duration }) => {
      if (this.seeking) return;
      this.progress.max = String(Math.floor(duration));
      this.progress.value = String(Math.floor(current));
      this.current.textContent = formatTime(current);
      this.total.textContent = formatTime(duration);
      this.paintRange(this.progress);
    });

    player.on('volume', (value) => {
      this.volume.value = String(value);
      this.paintRange(this.volume);
      setIcon(this.muteIcon, value === 0 ? 'mute' : 'volume');
    });

    player.on('modes', ({ shuffle, repeat }) => {
      this.shuffleButton.classList.toggle('player__control--active', shuffle);
      this.shuffleButton.setAttribute('aria-pressed', String(shuffle));
      this.repeatButton.classList.toggle('player__control--active', repeat !== 'off');
      this.repeatButton.classList.toggle('player__control--one', repeat === 'one');
      this.repeatButton.setAttribute('aria-label', { off: 'Повтор выключен', all: 'Повтор списка', one: 'Повтор трека' }[repeat]);
    });

    library.on('favorites', () => this.renderHeart());
  }
}
