import { Emitter } from './emitter';
import { synthesizeTrack } from './synth';
import { durationToSeconds } from '../utils/format';
import type { RepeatMode, Track } from '../types';

export const SEEK_STEP = 10;

interface PlayerEvents {
  track: Track | null;
  state: { playing: boolean };
  time: { current: number; duration: number };
  volume: number;
  modes: { shuffle: boolean; repeat: RepeatMode };
}

/**
 * Состояние плеера: очередь, текущий трек, воспроизведение.
 * Интерфейс только подписывается на события и вызывает методы.
 */
class Player extends Emitter<PlayerEvents> {
  private readonly audio = new Audio();
  private queue: Track[] = [];
  private index = -1;
  private readonly urls = new Map<number, string>();
  shuffle = false;
  repeat: RepeatMode = 'off';

  constructor() {
    super();
    this.audio.preload = 'auto';
    this.audio.volume = Number(localStorage.getItem('vibecast:volume') ?? 0.7);
    this.audio.addEventListener('timeupdate', () => this.emitTime());
    this.audio.addEventListener('loadedmetadata', () => this.emitTime());
    this.audio.addEventListener('play', () => this.emit('state', { playing: true }));
    this.audio.addEventListener('pause', () => this.emit('state', { playing: false }));
    this.audio.addEventListener('ended', () => this.onEnded());
  }

  get current(): Track | null {
    return this.queue[this.index] ?? null;
  }

  get playing(): boolean {
    return !this.audio.paused;
  }

  get volume(): number {
    return this.audio.volume;
  }

  /** Запускает трек; очередь — список, из которого его выбрали (все треки, избранное, результаты поиска). */
  play(track: Track, queue: readonly Track[]): void {
    if (this.current?.id === track.id) {
      this.toggle();
      return;
    }
    this.queue = [...queue];
    this.index = this.queue.findIndex((item) => item.id === track.id);
    this.load(true);
  }

  toggle(): void {
    if (!this.current) return;
    if (this.audio.paused) void this.audio.play();
    else this.audio.pause();
  }

  next(): void {
    if (!this.queue.length) return;
    this.index = this.shuffle ? this.randomIndex() : (this.index + 1) % this.queue.length;
    this.load(true);
  }

  previous(): void {
    if (!this.queue.length) return;
    // Как в большинстве плееров: если трек уже играет больше 3 секунд — начать его заново
    if (this.audio.currentTime > 3) {
      this.seek(0);
      return;
    }
    this.index = (this.index - 1 + this.queue.length) % this.queue.length;
    this.load(true);
  }

  seek(seconds: number): void {
    if (!this.current) return;
    const duration = this.duration;
    this.audio.currentTime = Math.max(0, Math.min(seconds, duration));
    this.emitTime();
  }

  skip(delta: number): void {
    this.seek(this.audio.currentTime + delta);
  }

  setVolume(value: number): void {
    this.audio.volume = Math.max(0, Math.min(1, value));
    localStorage.setItem('vibecast:volume', String(this.audio.volume));
    this.emit('volume', this.audio.volume);
  }

  toggleShuffle(): void {
    this.shuffle = !this.shuffle;
    this.emitModes();
  }

  cycleRepeat(): void {
    const order: RepeatMode[] = ['off', 'all', 'one'];
    this.repeat = order[(order.indexOf(this.repeat) + 1) % order.length];
    this.emitModes();
  }

  private get duration(): number {
    const track = this.current;
    if (Number.isFinite(this.audio.duration)) return this.audio.duration;
    return track ? durationToSeconds(track.duration) : 0;
  }

  private load(autoplay: boolean): void {
    const track = this.current;
    if (!track) return;
    let url = this.urls.get(track.id);
    if (!url) {
      // Аудио генерируется один раз на трек и кэшируется в памяти
      url = URL.createObjectURL(synthesizeTrack(track.id, durationToSeconds(track.duration)));
      this.urls.set(track.id, url);
    }
    this.audio.src = url;
    this.emit('track', track);
    this.emitTime();
    if (autoplay) void this.audio.play().catch(() => this.emit('state', { playing: false }));
  }

  private onEnded(): void {
    if (this.repeat === 'one') {
      this.seek(0);
      void this.audio.play();
      return;
    }
    const isLast = this.index === this.queue.length - 1;
    if (isLast && this.repeat === 'off' && !this.shuffle) {
      this.emit('state', { playing: false });
      return;
    }
    this.next();
  }

  private randomIndex(): number {
    if (this.queue.length < 2) return 0;
    let next = this.index;
    while (next === this.index) next = Math.floor(Math.random() * this.queue.length);
    return next;
  }

  private emitTime(): void {
    this.emit('time', { current: this.audio.currentTime, duration: this.duration });
  }

  private emitModes(): void {
    this.emit('modes', { shuffle: this.shuffle, repeat: this.repeat });
  }

  stop(): void {
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.queue = [];
    this.index = -1;
    this.emit('track', null);
  }
}

export const player = new Player();
