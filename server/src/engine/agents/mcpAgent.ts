import { AgentDecision, BuildDecision } from '../../types/agent';
import { Player } from '../../types/player';
import { Square } from '../../types/square';
import { GameState } from '../../types/game';
import { config } from '../../config';

export type PendingDecisionType = 'buy' | 'build' | 'lobster_pot';

export interface PendingDecision {
  type: PendingDecisionType;
  resolve: (value: unknown) => void;
  timeoutId: ReturnType<typeof setTimeout>;
  context: Record<string, unknown>;
}

/**
 * MCP Agent — implements AgentDecision interface.
 * When the engine asks for a decision, it stores a pending decision
 * that gets resolved when the agent calls the corresponding MCP tool.
 */
export class McpAgent implements AgentDecision {
  public readonly agentId: string;
  public readonly agentToken: string;
  public roomId: string | null = null;
  private pendingDecision: PendingDecision | null = null;

  constructor(agentId: string, agentToken: string) {
    this.agentId = agentId;
    this.agentToken = agentToken;
  }

  getPendingDecision(): PendingDecision | null {
    return this.pendingDecision;
  }

  resolveBuyDecision(buy: boolean): boolean {
    if (!this.pendingDecision || this.pendingDecision.type !== 'buy') return false;
    clearTimeout(this.pendingDecision.timeoutId);
    const { resolve } = this.pendingDecision;
    this.pendingDecision = null;
    resolve(buy);
    return true;
  }

  resolveBuildDecision(decision: BuildDecision | null): boolean {
    if (!this.pendingDecision || this.pendingDecision.type !== 'build') return false;
    clearTimeout(this.pendingDecision.timeoutId);
    const { resolve } = this.pendingDecision;
    this.pendingDecision = null;
    resolve(decision);
    return true;
  }

  resolveLobsterPotDecision(decision: 'pay' | 'card' | 'roll'): boolean {
    if (!this.pendingDecision || this.pendingDecision.type !== 'lobster_pot') return false;
    clearTimeout(this.pendingDecision.timeoutId);
    const { resolve } = this.pendingDecision;
    this.pendingDecision = null;
    resolve(decision);
    return true;
  }

  async decideBuy(player: Player, square: Square, state: GameState): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const timeoutId = setTimeout(() => {
        if (this.pendingDecision?.type === 'buy') {
          this.pendingDecision = null;
          resolve(false); // Default: pass
        }
      }, config.agentTimeoutMs);

      this.pendingDecision = {
        type: 'buy',
        resolve: resolve as (v: unknown) => void,
        timeoutId,
        context: {
          property: {
            name: square.name,
            index: square.index,
            price: square.price,
            colorGroup: square.colorGroup,
          },
          yourMoney: player.money,
        },
      };
    });
  }

  async decideBuild(
    player: Player,
    buildableSquares: number[],
    upgradeableSquares: number[],
    state: GameState
  ): Promise<BuildDecision | null> {
    return new Promise<BuildDecision | null>((resolve) => {
      const timeoutId = setTimeout(() => {
        if (this.pendingDecision?.type === 'build') {
          this.pendingDecision = null;
          resolve(null); // Default: skip
        }
      }, config.agentTimeoutMs);

      this.pendingDecision = {
        type: 'build',
        resolve: resolve as (v: unknown) => void,
        timeoutId,
        context: {
          buildableSquares: buildableSquares.map((idx) => ({
            index: idx,
            name: state.board[idx].name,
            outpostCost: state.board[idx].outpostCost,
            outposts: state.board[idx].outposts,
          })),
          upgradeableSquares: upgradeableSquares.map((idx) => ({
            index: idx,
            name: state.board[idx].name,
            fortressCost: state.board[idx].fortressCost,
          })),
          yourMoney: player.money,
        },
      };
    });
  }

  async decideLobsterPot(player: Player, state: GameState): Promise<'pay' | 'card' | 'roll'> {
    return new Promise<'pay' | 'card' | 'roll'>((resolve) => {
      const timeoutId = setTimeout(() => {
        if (this.pendingDecision?.type === 'lobster_pot') {
          this.pendingDecision = null;
          resolve('roll'); // Default: try to roll
        }
      }, config.agentTimeoutMs);

      this.pendingDecision = {
        type: 'lobster_pot',
        resolve: resolve as (v: unknown) => void,
        timeoutId,
        context: {
          turnsTrapped: player.lobsterPotTurns,
          hasEscapeCard: player.escapeCards.length > 0,
          yourMoney: player.money,
        },
      };
    });
  }
}

// --- Global MCP Agent Registry ---
// Maps agentToken → McpAgent instance
const mcpAgents = new Map<string, McpAgent>();

// Maps agentId → roomId (active game tracking)
const agentRooms = new Map<string, string>();

export function getOrCreateMcpAgent(agentId: string, agentToken: string): McpAgent {
  let agent = mcpAgents.get(agentToken);
  if (!agent) {
    agent = new McpAgent(agentId, agentToken);
    mcpAgents.set(agentToken, agent);
  }
  return agent;
}

export function getMcpAgentByToken(agentToken: string): McpAgent | undefined {
  return mcpAgents.get(agentToken);
}

export function setAgentRoom(agentId: string, roomId: string): void {
  agentRooms.set(agentId, roomId);
}

export function getAgentRoom(agentId: string): string | undefined {
  return agentRooms.get(agentId);
}

export function clearAgentRoom(agentId: string): void {
  agentRooms.delete(agentId);
}
