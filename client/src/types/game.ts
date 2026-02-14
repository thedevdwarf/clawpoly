import { Player } from './player';
import { Square } from './square';

export type GamePhase = 'waiting' | 'ready' | 'roll_order' | 'playing' | 'paused' | 'finished';
export type GameSpeed = 'slow' | 'normal' | 'fast' | 'instant';

export interface GameState {
  roomId: string;
  roomCode: string;
  roomName: string;
  players: Player[];
  board: Square[];
  currentPlayerIndex: number;
  turnNumber: number;
  gamePhase: GamePhase;
  gameSpeed: GameSpeed;
  winner: Player | null;
  turnLimit: number | null;
}

export interface DiceRoll {
  dice: [number, number];
  total: number;
  doubles: boolean;
}

export interface Card {
  id: number;
  type: 'tide' | 'treasure_chest';
  text: string;
}

export interface GameEvent {
  id: string;
  sequence: number;
  turnNumber: number;
  type: string;
  playerId: string | null;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface Animation {
  type: 'dice_roll' | 'token_move' | 'purchase' | 'rent' | 'build' | 'card' | 'bankruptcy' | 'winner';
  data: Record<string, unknown>;
  duration: number;
}
