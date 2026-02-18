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
    if (!session) {
      console.log(`[MCP-SSE] No session for agent ${mcpAgent.agentId}, skipping push`);
      return;
    }

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

    console.log(`[MCP-SSE] Pushed ${decision.type} notification to agent ${mcpAgent.agentId}`);
  };
}
