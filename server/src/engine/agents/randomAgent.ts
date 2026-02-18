import { AgentDecision, BuildDecision } from '../../types/agent';
import { Player } from '../../types/player';
import { Square } from '../../types/square';
import { GameState } from '../../types/game';

export class RandomAgent implements AgentDecision {
  async decideBuy(player: Player, square: Square, _state: GameState): Promise<boolean> {
    if (!square.price || player.money < square.price) return false;
    return Math.random() > 0.3; // 70% chance to buy
  }

  async decideBuild(
    player: Player,
    buildableSquares: number[],
    upgradeableSquares: number[],
    state: GameState
  ): Promise<BuildDecision | null> {
    if (Math.random() > 0.5) return null; // 50% chance to skip

    // Try upgrade first
    for (const idx of upgradeableSquares) {
      const sq = state.board[idx];
      if (sq.fortressCost && player.money >= sq.fortressCost) {
        return { squareIndex: idx, action: 'upgrade' };
      }
    }

    // Try build
    for (const idx of buildableSquares) {
      const sq = state.board[idx];
      if (sq.outpostCost && player.money >= sq.outpostCost) {
        return { squareIndex: idx, action: 'build' };
      }
    }

    return null;
  }

  async decideLobsterPot(player: Player, _state: GameState): Promise<'pay' | 'card' | 'roll'> {
    if (player.escapeCards.length > 0 && Math.random() > 0.5) return 'card';
    if (player.money >= 50 && Math.random() > 0.5) return 'pay';
    return 'roll';
  }
}
