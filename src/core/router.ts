import { Emitter } from './emitter';
import type { RouteName } from '../types';

const ROUTES: readonly RouteName[] = ['login', 'register', 'tracks', 'favorites', 'profile'];
const PUBLIC_ROUTES: readonly RouteName[] = ['login', 'register'];

interface RouterEvents {
  change: RouteName;
}

/** Hash-роутер: адреса вида #/tracks работают без настройки сервера. */
class HashRouter extends Emitter<RouterEvents> {
  constructor() {
    super();
    window.addEventListener('hashchange', () => this.emit('change', this.current));
  }

  get current(): RouteName {
    const name = window.location.hash.replace('#/', '') as RouteName;
    return ROUTES.includes(name) ? name : 'tracks';
  }

  isPublic(route: RouteName): boolean {
    return PUBLIC_ROUTES.includes(route);
  }

  go(route: RouteName): void {
    if (this.current === route && window.location.hash) {
      this.emit('change', route);
      return;
    }
    window.location.hash = `#/${route}`;
  }
}

export const router = new HashRouter();
