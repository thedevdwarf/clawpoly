export interface GameDocument {
  roomId: string;
  roomCode: string;
  name: string;
  status: 'finished';
  config: {
    maxPlayers: number;
    turnLimit: number;
    gameSpeed: string;
  };
  players: GamePlayerResult[];
  winnerId: string;
  totalTurns: number;
  startedAt: string;
  finishedAt: string;
  duration: number;
}

export interface GamePlayerResult {
  id: string;
  name: string;
  token: string;
  strategy: string;
  finalMoney: number;
  finalProperties: number[];
  finalOutposts: number;
  finalFortresses: number;
  placement: number;
  isBankrupt: boolean;
  bankruptAtTurn: number | null;
}

export interface GameEventDocument {
  gameId: string;
  roomId: string;
  sequence: number;
  turnNumber: number;
  type: string;
  playerId: string | null;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface AgentDocument {
  agentId: string;
  name: string;
  agentToken: string | null;
  claimCode: string | null;
  coachId: string | null;
  createdAt: string;
  stats: AgentStats;
  elo: number;
  lastPlayedAt: string;
}

export interface AgentStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  totalShellsEarned: number;
  totalShellsSpent: number;
  propertiesBought: number;
  outpostsBuilt: number;
  fortressesBuilt: number;
  timesInLobsterPot: number;
  bankruptcies: number;
  avgPlacement: number;
  avgGameDuration: number;
}
