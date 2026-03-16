import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpAgent, PendingDecision } from '../engine/agents/mcpAgent';

// agentToken → sessionId
const tokenToSession = new Map<string, string>();

// sessionId → McpServer instance
const sessionToServer = new Map<string, McpServer>();

export function registerSession(sessionId: string, server: McpServer): void {
  sessionToServer.set(sessionId, server);
}

export function unregisterSession(sessionId: string): void {
  sessionToServer.delete(sessionId);
  for (const [token, sid] of tokenToSession) {
    if (sid === sessionId) {
      tokenToSession.delete(token);
    }
  }
}

export function bindAgentToSession(agentToken: string, sessionId: string): void {
  tokenToSession.set(agentToken, sessionId);
}

export function getSessionForAgent(agentToken: string): { sessionId: string; server: McpServer } | null {
  const sessionId = tokenToSession.get(agentToken);
  if (!sessionId) return null;
  const server = sessionToServer.get(sessionId);
  if (!server) return null;
  return { sessionId, server };
}

/**
 * Attach SSE push notification callback to an McpAgent.
 * When a pending decision is created, sends a logging notification
 * to the agent's MCP session via SSE.
 */
export function attachNotificationCallback(mcpAgent: McpAgent): void {
  mcpAgent.onDecisionPending = (decision: PendingDecision) => {
    const session = getSessionForAgent(mcpAgent.agentToken);
    if (!session) return;
    session.server.sendLoggingMessage({
      level: 'info',
      logger: 'clawpoly',
      data: {
        event: 'pending_decision',
        type: decision.type,
        context: decision.context,
        message: `Decision required: ${decision.type}. Call clawpoly_get_state with your action now.`,
      },
    }, session.sessionId).catch((err: unknown) => {
      console.error(`[MCP-SSE] Failed to push to agent ${mcpAgent.agentId}:`, err);
    });
  };

  mcpAgent.onGameStarted = (data) => {
    const session = getSessionForAgent(mcpAgent.agentToken);
    if (!session) return;
    session.server.sendLoggingMessage({
      level: 'info',
      logger: 'clawpoly',
      data: {
        event: 'game_started',
        ...data,
        message: `🎮 Your game has started! Room: ${data.roomCode}. Opponents: ${data.players.filter(p => p.name !== mcpAgent.agentId).map(p => p.name).join(', ')}. Start polling clawpoly_get_state now!`,
      },
    }, session.sessionId).catch((err: unknown) => {
      console.error(`[MCP-SSE] Failed to push game_started to agent ${mcpAgent.agentId}:`, err);
    });
  };

  mcpAgent.onGameFinished = (data) => {
    const session = getSessionForAgent(mcpAgent.agentToken);
    if (!session) return;
    session.server.sendLoggingMessage({
      level: 'info',
      logger: 'clawpoly',
      data: {
        event: 'game_finished',
        ...data,
        message: data.isWinner
          ? `🏆 Your agent WON! Game finished in ${data.totalTurns} turns. Tell your user they won!`
          : `🎮 Game over! Winner: ${data.winnerName}. Finished in ${data.totalTurns} turns. Tell your user the result!`,
      },
    }, session.sessionId).catch((err: unknown) => {
      console.error(`[MCP-SSE] Failed to push game_finished to agent ${mcpAgent.agentId}:`, err);
    });
  };
}
