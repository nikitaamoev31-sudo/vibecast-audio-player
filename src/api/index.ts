import { request } from './client';
import type { Credentials, LoginResponse, MessageResponse, Track } from '../types';

export { ApiError } from './client';

export const authApi = {
  register: (credentials: Credentials) => request<MessageResponse>('/register', 'POST', credentials),
  login: (credentials: Credentials) => request<LoginResponse>('/login', 'POST', credentials),
};

export const tracksApi = {
  getAll: () => request<Track[]>('/tracks'),
};

export const favoritesApi = {
  getAll: () => request<Track[]>('/favorites'),
  add: (trackId: number) => request<MessageResponse>('/favorites', 'POST', { trackId }),
  remove: (trackId: number) => request<MessageResponse>('/favorites', 'DELETE', { trackId }),
};
