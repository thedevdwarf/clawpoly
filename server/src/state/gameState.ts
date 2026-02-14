import { GameState, GameConfig } from '../types/game';
import { createBoard } from '../engine/board';
import { createTideCards, createTreasureChestCards } from '../engine/cards';

const DEFAULT_CONFIG: GameConfig = {
  maxPlayers: 4,
  turnLimit: 200,
  gameSpeed: 'normal',
};

export function createInitialGameState(
  roomId: string,
  roomCode: string,
  roomName: string,
  config: Partial<GameConfig> = {}
): GameState {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return {
    roomId,
    roomCode,
    roomName,
    players: [],
    board: createBoard(),
    currentPlayerIndex: 0,
    turnNumber: 0,
    tideCards: createTideCards(),
    treasureChestCards: createTreasureChestCards(),
    gamePhase: 'waiting',
    gameSpeed: finalConfig.gameSpeed,
    winner: null,
    turnLimit: finalConfig.turnLimit,
  };
}
