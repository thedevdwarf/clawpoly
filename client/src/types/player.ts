export type TokenType = 'lobster' | 'crab' | 'octopus' | 'seahorse' | 'dolphin' | 'shark';

export interface Player {
  id: string;
  name: string;
  token: TokenType;
  color: string;
  money: number;
  position: number;
  properties: number[];
  inLobsterPot: boolean;
  lobsterPotTurns: number;
  escapeCards: number;
  isBankrupt: boolean;
  connected: boolean;
  consecutiveTimeouts: number;
}

export const TOKEN_COLORS: Record<TokenType, string> = {
  lobster: '#e74c3c',
  crab: '#e67e22',
  octopus: '#9b59b6',
  seahorse: '#2ecc71',
  dolphin: '#3498db',
  shark: '#95a5a6',
};
