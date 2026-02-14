// TODO: REST API client
// Base URL will come from environment variable

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  // Rooms
  getRooms: () => fetchApi('/rooms'),
  getRoom: (roomId: string) => fetchApi(`/rooms/${roomId}`),
  getRoomState: (roomId: string) => fetchApi(`/rooms/${roomId}/state`),

  // Games
  getGames: () => fetchApi('/games'),
  getGame: (gameId: string) => fetchApi(`/games/${gameId}`),
  getGameEvents: (gameId: string) => fetchApi(`/games/${gameId}/events`),

  // Agents
  getAgents: () => fetchApi('/agents'),
  getAgent: (agentId: string) => fetchApi(`/agents/${agentId}`),

  // Leaderboard
  getLeaderboard: () => fetchApi('/leaderboard'),

  // Health
  getHealth: () => fetchApi('/health'),
};
