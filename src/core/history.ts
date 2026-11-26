import { session } from './session';

type DateMap = Record<string, number>;

interface UserHistory {
  /** Когда трек впервые появился в медиатеке пользователя. */
  seen: DateMap;
  /** Когда трек добавлен в избранное. */
  favorites: DateMap;
}

const PREFIX = 'vibecast:history:';

function isDateMap(value: unknown): value is DateMap {
  return typeof value === 'object' && value !== null && Object.values(value).every((item) => typeof item === 'number');
}

/**
 * Даты добавления треков. API их не отдаёт, поэтому клиент сам запоминает,
 * когда трек появился у пользователя и когда попал в избранное.
 * Данные хранятся в localStorage отдельно для каждого пользователя.
 */
class TrackHistory {
  private cache: { user: string; data: UserHistory } | null = null;

  /** Отмечает новые треки каталога датой первого появления. */
  registerCatalog(ids: readonly number[], favoriteIds: readonly number[]): void {
    const data = this.data();
    if (!data) return;
    const now = Date.now();
    for (const id of ids) data.seen[id] ??= now;
    // Избранное с сервера, для которого ещё нет даты (например, добавлено с другого устройства)
    for (const id of favoriteIds) data.favorites[id] ??= data.seen[id] ?? now;
    this.save();
  }

  setFavorite(id: number, favorite: boolean): void {
    const data = this.data();
    if (!data) return;
    if (favorite) data.favorites[id] = Date.now();
    else data.favorites = Object.fromEntries(Object.entries(data.favorites).filter(([key]) => key !== String(id)));
    this.save();
  }

  /** Для избранного — дата добавления в избранное, для остальных — дата появления в медиатеке. */
  addedAt(id: number, favorite: boolean): number | null {
    const data = this.data();
    if (!data) return null;
    return (favorite ? data.favorites[id] : undefined) ?? data.seen[id] ?? null;
  }

  private data(): UserHistory | null {
    const user = session.username;
    if (!user) return null;
    if (this.cache?.user !== user) this.cache = { user, data: this.read(user) };
    return this.cache.data;
  }

  private read(user: string): UserHistory {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(PREFIX + user) ?? 'null');
      if (typeof parsed === 'object' && parsed !== null) {
        const { seen, favorites } = parsed as Partial<UserHistory>;
        if (isDateMap(seen) && isDateMap(favorites)) return { seen, favorites };
      }
    } catch {
      // Повреждённые данные просто перезаписываем
    }
    return { seen: {}, favorites: {} };
  }

  private save(): void {
    if (!this.cache) return;
    try {
      localStorage.setItem(PREFIX + this.cache.user, JSON.stringify(this.cache.data));
    } catch {
      // Переполненное хранилище не должно ломать плеер
    }
  }
}

export const history = new TrackHistory();
