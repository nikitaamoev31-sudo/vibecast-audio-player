import { session } from '../core/session';
import type { MessageResponse } from '../types';

const BASE_URL = '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Method = 'GET' | 'POST' | 'DELETE';

function isMessageResponse(value: unknown): value is MessageResponse {
  return typeof value === 'object' && value !== null && typeof (value as MessageResponse).message === 'string';
}

/**
 * Обёртка над fetch: подставляет токен, разбирает JSON и превращает
 * ответы с ошибкой в ApiError с сообщением от сервера.
 */
export async function request<T>(path: string, method: Method = 'GET', body?: object): Promise<T> {
  const headers: Record<string, string> = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (session.token) headers.Authorization = `Bearer ${session.token}`;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Сервер недоступен. Проверьте, что бэкенд запущен.', 0);
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message = isMessageResponse(data) ? data.message : `Ошибка ${response.status}`;
    // 400 «токен некорректный» и 403 «доступ запрещён» означают, что сессия больше не действует
    if (response.status === 403 || (response.status === 400 && message.includes('токен'))) {
      session.end();
    }
    throw new ApiError(message, response.status);
  }

  return data as T;
}
