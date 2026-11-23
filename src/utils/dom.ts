import { el, type RedomQueryArgument } from 'redom';

/**
 * Типизированная обёртка над el() из RE:DOM: el('input.field') возвращает
 * HTMLElement, а здесь тип элемента выводится из имени тега.
 */
export function tag<K extends keyof HTMLElementTagNameMap>(
  name: K,
  className: string,
  ...args: RedomQueryArgument[]
): HTMLElementTagNameMap[K] {
  const query = className ? `${name}.${className.trim().split(/\s+/).join('.')}` : name;
  return el(query, ...args) as unknown as HTMLElementTagNameMap[K];
}
