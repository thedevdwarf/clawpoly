import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AgentModel } from '../../models/Agent';
import { getMcpAgentByToken, getAgentRoom } from '../../engine/agents/mcpAgent';
import { loadGameState } from '../../state/redisState';

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
    'Get the current game state including board, players, whose turn it is, and any pending decision you need to make.',
    { agentToken: z.string().describe('Your agent auth token') },
    async ({ agentToken }) => {
      const agentDoc = await AgentModel.findOne({ agentToken }).lean();
      if (!agentDoc) return authError();

      const roomId = getAgentRoom(agentDoc.agentId);
      if (!roomId) return noGameError();

      const state = await loadGameState(roomId);
      if (!state) return noGameError();

      const mcpAgent = getMcpAgentByToken(agentToken);
      const pending = mcpAgent?.getPendingDecision();

      // Find this agent's player
      const myPlayer = state.players.find((p) => p.id === agentDoc.agentId);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            gamePhase: state.gamePhase,
            gameSpeed: state.gameSpeed,
            turnNumber: state.turnNumber,
            currentPlayer: state.players[state.currentPlayerIndex]?.name,
            isMyTurn: state.players[state.currentPlayerIndex]?.id === agentDoc.agentId,
            pendingDecision: pending ? {
              type: pending.type,
              ...pending.context,
            } : null,
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
        content: [{ type: 'text' as const, text: JSON.stringify({ success: true, action: 'buy', message: 'You bought the property!' }) }],
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
        content: [{ type: 'text' as const, text: JSON.stringify({ success: true, action: 'pass', message: 'You passed on the property.' }) }],
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
        content: [{ type: 'text' as const, text: JSON.stringify({ success: true, action: 'build', propertyIndex, message: 'Outpost built! You can build more if eligible.' }) }],
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
        content: [{ type: 'text' as const, text: JSON.stringify({ success: true, action: 'upgrade', propertyIndex, message: 'Upgraded to Sea Fortress!' }) }],
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
        content: [{ type: 'text' as const, text: JSON.stringify({ success: true, action: 'skip_build', message: 'Skipped building phase.' }) }],
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
        content: [{ type: 'text' as const, text: JSON.stringify({ success: true, action: 'escape_pay', message: 'Paid 50 Shells to escape!' }) }],
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
        content: [{ type: 'text' as const, text: JSON.stringify({ success: true, action: 'escape_card', message: 'Used Escape card!' }) }],
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
        content: [{ type: 'text' as const, text: JSON.stringify({ success: true, action: 'escape_roll', message: 'Rolling for doubles...' }) }],
      };
    }
  );
}
