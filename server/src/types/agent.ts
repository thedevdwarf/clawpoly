import { Player } from './player';
import { Square } from './square';
import { GameState } from './game';

export interface BuildDecision {
  squareIndex: number;
  action: 'build' | 'upgrade';
}

export interface AgentDecision {
  decideBuy(
    player: Player,
    square: Square,
    state: GameState
  ): Promise<boolean>;

  decideBuild(
    player: Player,
    buildableSquares: number[],
    upgradeableSquares: number[],
    state: GameState
  ): Promise<BuildDecision | null>;

  decideLobsterPot(
    player: Player,
    state: GameState
  ): Promise<'pay' | 'card' | 'roll'>;
}
