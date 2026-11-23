import { el, mount, unmount } from 'redom';

/** Короткое уведомление об ошибке или успешном действии. */
export function toast(message: string, kind: 'error' | 'info' = 'info'): void {
  const node = el(`div.toast.toast--${kind}`, { role: 'status' }, message);
  mount(document.body, node);
  window.setTimeout(() => node.classList.add('toast--hide'), 2600);
  window.setTimeout(() => unmount(document.body, node), 3000);
}
