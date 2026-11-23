import { Emitter } from './emitter';

const TOKEN_KEY = 'vibecast:token';
const USER_KEY = 'vibecast:username';

interface SessionEvents {
  change: string | null;
}

/** Хранит токен и имя пользователя между перезагрузками страницы. */
class Session extends Emitter<SessionEvents> {
  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get username(): string | null {
    return localStorage.getItem(USER_KEY);
  }

  get isAuthorized(): boolean {
    return this.token !== null;
  }

  start(token: string, username: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, username);
    this.emit('change', username);
  }

  end(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.emit('change', null);
  }
}

export const session = new Session();
