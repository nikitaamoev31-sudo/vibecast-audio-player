/** Трек в том виде, в котором его отдаёт API. */
export interface Track {
  id: number;
  title: string;
  artist: string;
  /** Длительность в минутах (десятичная дробь, например 4.24). */
  duration: number;
  size_mb: number;
  encoded_audio: string;
}

export interface MessageResponse {
  message: string;
}

export interface LoginResponse extends MessageResponse {
  token: string;
}

export interface Credentials {
  username: string;
  password: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

export type RouteName = 'login' | 'register' | 'tracks' | 'favorites' | 'profile';
