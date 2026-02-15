import { RoomResponse, GameResponse, LeaderboardEntry } from '@/types/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function createRoom(name: string, opts?: { maxPlayers?: number; turnLimit?: number; gameSpeed?: string }) {
  return request<RoomResponse>('/rooms', {
    method: 'POST',
    body: JSON.stringify({ name, ...opts }),
  });
}

export async function listRooms() {
  return request<{ rooms: RoomResponse[] }>('/rooms');
}

export async function getRoom(roomId: string) {
  return request<RoomResponse & { players: { id: string; name: string; token: string; color: string }[] }>(`/rooms/${roomId}`);
}

export async function joinRoom(roomId: string, agentName: string, agentId?: string) {
  return request<{ agentToken: string }>(`/rooms/${roomId}/join`, {
    method: 'POST',
    body: JSON.stringify({ agentName, agentId }),
  });
}

export async function startGame(roomId: string) {
  return request<{ status: string }>(`/rooms/${roomId}/start`, { method: 'POST' });
}

export async function deleteRoom(roomId: string) {
  return request<{ status: string }>(`/rooms/${roomId}`, { method: 'DELETE' });
}

export async function listGames(page = 1, limit = 20) {
  return request<{ games: GameResponse[]; total: number; page: number; limit: number; pages: number }>(`/games?page=${page}&limit=${limit}`);
}

export async function getGame(gameId: string) {
  return request<GameResponse>(`/games/${gameId}`);
}

export async function getLeaderboard() {
  return request<{ leaderboard: LeaderboardEntry[] }>('/agents/leaderboard');
}
