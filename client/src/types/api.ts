export interface RoomResponse {
  id: string;
  roomCode: string;
  name: string;
  status: string;
  playerCount: number;
  maxPlayers: number;
  createdAt: string;
}

export interface GameResponse {
  id: string;
  roomCode: string;
  name: string;
  winnerId: string;
  totalTurns: number;
  startedAt: string;
  finishedAt: string;
  players: GamePlayerResult[];
}

export interface GamePlayerResult {
  id: string;
  name: string;
  token: string;
  finalMoney: number;
  placement: number;
  isBankrupt: boolean;
}

export interface AgentResponse {
  agentId: string;
  name: string;
  elo: number;
  stats: {
    gamesPlayed: number;
    wins: number;
    winRate: number;
  };
}

export interface LeaderboardEntry {
  rank: number;
  agentId: string;
  name: string;
  elo: number;
  gamesPlayed: number;
  wins: number;
  winRate: number;
}
