import { Player } from './player';
import { Square } from './square';
import { Card } from './cards';

export type GamePhase = 'waiting' | 'ready' | 'roll_order' | 'playing' | 'paused' | 'finished';
export type GameSpeed = 'very_slow' | 'slow' | 'normal' | 'fast' | 'instant';

export interface GameState {
  roomId: string;
  roomCode: string;
  roomName: string;
  players: Player[];
  board: Square[];
  currentPlayerIndex: number;
  turnNumber: number;
  tideCards: Card[];
  treasureChestCards: Card[];
  gamePhase: GamePhase;
  gameSpeed: GameSpeed;
  winner: Player | null;
  turnLimit: number | null;
}

export interface GameConfig {
  maxPlayers: number;
  turnLimit: number;
  gameSpeed: GameSpeed;
}

export interface DiceRoll {
  dice: [number, number];
  total: number;
  doubles: boolean;
}

export interface GameEvent {
  id: string;
  roomId: string;
  sequence: number;
  turnNumber: number;
  type: string;
  playerId: string | null;
  data: Record<string, unknown>;
  timestamp: string;
}
