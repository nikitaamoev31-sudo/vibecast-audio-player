import { favoritesApi, tracksApi } from '../api';
import { Emitter } from './emitter';
import type { Track } from '../types';

interface LibraryEvents {
  favorites: ReadonlySet<number>;
  error: string;
}

/**
 * Кэш треков и избранного. Список треков и избранное запрашиваются
 * один раз за сессию — дальше состояние меняется локально, без лишних запросов.
 */
class Library extends Emitter<LibraryEvents> {
  private tracks: Track[] = [];
  private favoriteIds = new Set<number>();
  private loading: Promise<void> | null = null;

  load(): Promise<void> {
    this.loading ??= Promise.all([tracksApi.getAll(), favoritesApi.getAll()])
      .then(([tracks, favorites]) => {
        this.tracks = tracks;
        this.favoriteIds = new Set(favorites.map((track) => track.id));
        this.emit('favorites', this.favoriteIds);
      })
      .catch((error: unknown) => {
        this.loading = null;
        throw error;
      });
    return this.loading;
  }

  reset(): void {
    this.tracks = [];
    this.favoriteIds.clear();
    this.loading = null;
  }

  get all(): readonly Track[] {
    return this.tracks;
  }

  get favorites(): Track[] {
    return this.tracks.filter((track) => this.favoriteIds.has(track.id));
  }

  isFavorite(id: number): boolean {
    return this.favoriteIds.has(id);
  }

  /** Оптимистичное переключение: интерфейс реагирует сразу, при ошибке откатываемся. */
  async toggleFavorite(id: number): Promise<void> {
    const wasFavorite = this.favoriteIds.has(id);
    if (wasFavorite) this.favoriteIds.delete(id);
    else this.favoriteIds.add(id);
    this.emit('favorites', this.favoriteIds);

    try {
      await (wasFavorite ? favoritesApi.remove(id) : favoritesApi.add(id));
    } catch (error) {
      if (wasFavorite) this.favoriteIds.add(id);
      else this.favoriteIds.delete(id);
      this.emit('favorites', this.favoriteIds);
      this.emit('error', error instanceof Error ? error.message : 'Не удалось обновить избранное');
    }
  }
}

export const library = new Library();
