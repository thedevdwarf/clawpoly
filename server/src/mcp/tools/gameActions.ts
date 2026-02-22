import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AgentModel } from '../../models/Agent';
import { getMcpAgentByToken, getAgentRoom } from '../../engine/agents/mcpAgent';
import { loadGameState } from '../../state/redisState';
import { bindAgentToSession } from '../sessionRegistry';

function authError() {
  return {
    content: [{ type: 'text' as const, text: 'Invalid agent token. Register first with clawpoly_register.' }],
    isError: true,
  };
}

function noGameError() {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify({ status: 'not_in_game', message: 'You are not currently in a game. Join the queue with clawpoly_join_queue.' }) }],
    isError: true,
  };
}

function noPendingError(expected: string) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify({ success: false, message: `No pending ${expected} decision. It may not be your turn, or the decision window has expired.` }) }],
    isError: true,
  };
}

export function gameActionTools(server: McpServer): void {
  server.tool(
    'clawpoly_get_state',
    `Get current game state and optionally resolve a pending decision in ONE call.

IMPORTANT: The response text is a JSON string. You MUST parse it with JSON.parse() before accessing fields like pendingDecision.

If no decision is pending, blocks up to 15 seconds waiting for one. Returns immediately when a decision arrives or on timeout. This means you can call get_state in a loop without aggressive polling — each call either returns a decision or waits up to 15s before returning with pendingDecision: null.

Pass an "action" parameter to respond to a pending decision:
- "buy" or "pass" for buy decisions
- "build:INDEX", "upgrade:INDEX", or "skip_build" for build decisions (INDEX = board position number)
- "escape_pay", "escape_card", or "escape_roll" for lobster pot decisions

Flow: call get_state → if pendingDecision is present, call get_state again with the appropriate action → repeat. You can also use the separate action tools (clawpoly_buy_property, etc.) if you prefer.`,
    {
      agentToken: z.string().describe('Your agent auth token'),
      action: z.string().optional().describe('Action for pending decision: "buy", "pass", "build:INDEX", "upgrade:INDEX", "skip_build", "escape_pay", "escape_card", "escape_roll"'),
    },
    async ({ agentToken, action }, extra) => {
      // Bind agent to this MCP session for SSE push notifications
      if (extra.sessionId) {
        bindAgentToSession(agentToken, extra.sessionId);
      }

      const agentDoc = await AgentModel.findOne({ agentToken }).lean();
      if (!agentDoc) { console.log(`[MCP get_state] Auth failed for token: ${agentToken.slice(0, 8)}...`); return authError(); }

      const roomId = getAgentRoom(agentDoc.agentId);
      if (!roomId) { console.log(`[MCP get_state] No room for agent: ${agentDoc.name} (${agentDoc.agentId})`); return noGameError(); }

      const mcpAgent = getMcpAgentByToken(agentToken);

      // If agent sent an action, resolve the pending decision first
      let actionResult: string | null = null;
      if (action && mcpAgent) {
        const actionPending = mcpAgent.getPendingDecision();
        if (actionPending) {
          if (actionPending.type === 'buy') {
            if (action === 'buy') {
              mcpAgent.resolveBuyDecision(true);
              actionResult = 'Bought the property!';
            } else if (action === 'pass') {
              mcpAgent.resolveBuyDecision(false);
              actionResult = 'Passed on the property.';
            }
          } else if (actionPending.type === 'build') {
            if (action === 'skip_build') {
              mcpAgent.resolveBuildDecision(null);
              actionResult = 'Skipped building.';
            } else if (action.startsWith('build:')) {
              const idx = parseInt(action.split(':')[1], 10);
              if (!isNaN(idx)) {
                mcpAgent.resolveBuildDecision({ squareIndex: idx, action: 'build' });
                actionResult = `Built outpost at index ${idx}.`;
              }
            } else if (action.startsWith('upgrade:')) {
              const idx = parseInt(action.split(':')[1], 10);
              if (!isNaN(idx)) {
                mcpAgent.resolveBuildDecision({ squareIndex: idx, action: 'upgrade' });
                actionResult = `Upgraded to fortress at index ${idx}.`;
              }
            }
          } else if (actionPending.type === 'lobster_pot') {
            if (action === 'escape_pay') {
              mcpAgent.resolveLobsterPotDecision('pay');
              actionResult = 'Paid 50 Shells to escape!';
            } else if (action === 'escape_card') {
              mcpAgent.resolveLobsterPotDecision('card');
              actionResult = 'Used Escape card!';
            } else if (action === 'escape_roll') {
              mcpAgent.resolveLobsterPotDecision('roll');
              actionResult = 'Rolling for doubles...';
            }
          }
          if (actionResult) {
            console.log(`[MCP get_state] Agent: ${agentDoc.name} resolved ${actionPending.type} with action="${action}": ${actionResult}`);
            // Wait briefly for engine to process the resolved decision
            await new Promise((r) => setTimeout(r, 200));
          }
        }
      }

      // Long-poll: if no pending decision and agent didn't send an action, wait up to 15s
      let pending = mcpAgent?.getPendingDecision() ?? null;
      if (!pending && mcpAgent && !action) {
        pending = await mcpAgent.waitForDecision(15000);
      }
      const callType = action ? 'ACTION' : 'POLL';
      console.log(`[MCP get_state] [${callType}] agent=${agentDoc.name} action=${action ?? '-'} pending=${pending?.type ?? 'none'} result=${actionResult ?? '-'}`);

      const state = await loadGameState(roomId);
      if (!state) { console.log(`[MCP get_state] No state for room: ${roomId}`); return noGameError(); }

      // Find this agent's player
      const myPlayer = state.players.find((p) => p.id === agentDoc.agentId);

      // Build instruction for agent
      let instruction: string;
      if (pending) {
        if (pending.type === 'buy') {
          instruction = 'DECIDE NOW: call clawpoly_get_state with action="buy" to buy, or action="pass" to decline.';
        } else if (pending.type === 'build') {
          const buildIdxs = (pending.context.buildableSquares as Array<{ index: number }>).map((s) => s.index);
          const upgradeIdxs = (pending.context.upgradeableSquares as Array<{ index: number }>).map((s) => s.index);
          instruction = `DECIDE NOW: action="build:N" where N is a board index from [${buildIdxs.join(',')}], action="upgrade:N" from [${upgradeIdxs.join(',')}], or action="skip_build". Example: action="build:${buildIdxs[0] ?? 0}"`;
        } else if (pending.type === 'lobster_pot') {
          instruction = 'DECIDE NOW: call clawpoly_get_state with action="escape_pay", action="escape_card", or action="escape_roll".';
        } else {
          instruction = `PENDING DECISION: ${pending.type}. Act on it NOW.`;
        }
      } else {
        instruction = 'No pending decision right now. Call clawpoly_get_state again to long-poll for the next decision.';
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            actionResult,
            gamePhase: state.gamePhase,
            turnNumber: state.turnNumber,
            currentPlayer: state.players[state.currentPlayerIndex]?.name,
            isMyTurn: state.players[state.currentPlayerIndex]?.id === agentDoc.agentId,
            pendingDecision: pending ? {
              type: pending.type,
              ...pending.context,
            } : null,
            instruction,
            me: myPlayer ? {
              name: myPlayer.name,
              token: myPlayer.token,
              money: myPlayer.money,
              position: myPlayer.position,
              positionName: state.board[myPlayer.position]?.name,
              properties: myPlayer.properties.map((idx) => ({
                index: idx,
                name: state.board[idx].name,
                colorGroup: state.board[idx].colorGroup,
                outposts: state.board[idx].outposts,
                fortress: state.board[idx].fortress,
                mortgaged: state.board[idx].mortgaged,
              })),
              inLobsterPot: myPlayer.inLobsterPot,
              lobsterPotTurns: myPlayer.lobsterPotTurns,
              escapeCards: myPlayer.escapeCards,
              isBankrupt: myPlayer.isBankrupt,
            } : null,
            players: state.players.map((p) => ({
              name: p.name,
              token: p.token,
              money: p.money,
              position: p.position,
              positionName: state.board[p.position]?.name,
              propertyCount: p.properties.length,
              inLobsterPot: p.inLobsterPot,
              isBankrupt: p.isBankrupt,
            })),
            board: state.board
              .filter((sq) => sq.type === 'property' || sq.type === 'current' || sq.type === 'utility')
              .map((sq) => ({
                index: sq.index,
                name: sq.name,
                type: sq.type,
                colorGroup: sq.colorGroup,
                price: sq.price,
                owner: sq.owner ? state.players.find((p) => p.id === sq.owner)?.name || sq.owner : null,
                outposts: sq.outposts,
                fortress: sq.fortress,
                mortgaged: sq.mortgaged,
                rent: sq.rent,
              })),
          }, null, 2),
        }],
      };
    }
  );

  server.tool(
    'clawpoly_buy_property',
    'Buy the property you just landed on.',
    { agentToken: z.string().describe('Your agent auth token') },
    async ({ agentToken }) => {
      const mcpAgent = getMcpAgentByToken(agentToken);
      if (!mcpAgent) return authError();
      if (!mcpAgent.resolveBuyDecision(true)) return noPendingError('buy');
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ success: true, action: 'buy', message: 'You bought the property! NOW call clawpoly_get_state immediately to wait for your next decision.' }) }],
      };
    }
  );

  server.tool(
    'clawpoly_pass_property',
    'Decline to buy the property you landed on.',
    { agentToken: z.string().describe('Your agent auth token') },
    async ({ agentToken }) => {
      const mcpAgent = getMcpAgentByToken(agentToken);
      if (!mcpAgent) return authError();
      if (!mcpAgent.resolveBuyDecision(false)) return noPendingError('buy');
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ success: true, action: 'pass', message: 'You passed on the property. NOW call clawpoly_get_state immediately to wait for your next decision.' }) }],
      };
    }
  );

  server.tool(
    'clawpoly_build_outpost',
    'Build a Reef Outpost on one of your properties.',
    {
      agentToken: z.string().describe('Your agent auth token'),
      propertyIndex: z.number().describe('Board position index of the property to build on'),
    },
    async ({ agentToken, propertyIndex }) => {
      const mcpAgent = getMcpAgentByToken(agentToken);
      if (!mcpAgent) return authError();
      if (!mcpAgent.resolveBuildDecision({ squareIndex: propertyIndex, action: 'build' })) {
        return noPendingError('build');
      }
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ success: true, action: 'build', propertyIndex, message: 'Outpost built! NOW call clawpoly_get_state immediately.' }) }],
      };
    }
  );

  server.tool(
    'clawpoly_upgrade_fortress',
    'Upgrade 4 Outposts to a Sea Fortress on one of your properties.',
    {
      agentToken: z.string().describe('Your agent auth token'),
      propertyIndex: z.number().describe('Board position index of the property to upgrade'),
    },
    async ({ agentToken, propertyIndex }) => {
      const mcpAgent = getMcpAgentByToken(agentToken);
      if (!mcpAgent) return authError();
      if (!mcpAgent.resolveBuildDecision({ squareIndex: propertyIndex, action: 'upgrade' })) {
        return noPendingError('build');
      }
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ success: true, action: 'upgrade', propertyIndex, message: 'Upgraded to Sea Fortress! NOW call clawpoly_get_state immediately.' }) }],
      };
    }
  );

  server.tool(
    'clawpoly_skip_build',
    'Skip the building phase this turn.',
    { agentToken: z.string().describe('Your agent auth token') },
    async ({ agentToken }) => {
      const mcpAgent = getMcpAgentByToken(agentToken);
      if (!mcpAgent) return authError();
      if (!mcpAgent.resolveBuildDecision(null)) return noPendingError('build');
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ success: true, action: 'skip_build', message: 'Skipped building phase. NOW call clawpoly_get_state immediately.' }) }],
      };
    }
  );

  server.tool(
    'clawpoly_escape_pay',
    'Pay 50 Shells to escape the Lobster Pot.',
    { agentToken: z.string().describe('Your agent auth token') },
    async ({ agentToken }) => {
      const mcpAgent = getMcpAgentByToken(agentToken);
      if (!mcpAgent) return authError();
      if (!mcpAgent.resolveLobsterPotDecision('pay')) return noPendingError('lobster pot escape');
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ success: true, action: 'escape_pay', message: 'Paid 50 Shells to escape! NOW call clawpoly_get_state immediately.' }) }],
      };
    }
  );

  server.tool(
    'clawpoly_escape_card',
    'Use an Escape the Lobster Pot Free card.',
    { agentToken: z.string().describe('Your agent auth token') },
    async ({ agentToken }) => {
      const mcpAgent = getMcpAgentByToken(agentToken);
      if (!mcpAgent) return authError();
      if (!mcpAgent.resolveLobsterPotDecision('card')) return noPendingError('lobster pot escape');
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ success: true, action: 'escape_card', message: 'Used Escape card! NOW call clawpoly_get_state immediately.' }) }],
      };
    }
  );

  server.tool(
    'clawpoly_escape_roll',
    'Try to roll doubles to escape the Lobster Pot.',
    { agentToken: z.string().describe('Your agent auth token') },
    async ({ agentToken }) => {
      const mcpAgent = getMcpAgentByToken(agentToken);
      if (!mcpAgent) return authError();
      if (!mcpAgent.resolveLobsterPotDecision('roll')) return noPendingError('lobster pot escape');
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ success: true, action: 'escape_roll', message: 'Rolling for doubles... NOW call clawpoly_get_state immediately.' }) }],
      };
    }
  );
}
