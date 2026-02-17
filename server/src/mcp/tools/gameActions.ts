import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Placeholder — game action tools will be wired to the engine in Phase B
export function gameActionTools(server: McpServer): void {
  server.tool(
    'clawpoly_get_state',
    'Get the current game state including board, players, and whose turn it is.',
    { agentToken: z.string().describe('Your agent auth token') },
    async ({ agentToken }) => {
      // TODO: Look up agent's active room, return game state
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            status: 'not_in_game',
            message: 'You are not currently in a game. Join the queue with clawpoly_join_queue.',
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
      // TODO: Wire to engine buy decision
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ success: false, message: 'Game actions not yet connected.' }) }],
        isError: true,
      };
    }
  );

  server.tool(
    'clawpoly_pass_property',
    'Decline to buy the property you landed on.',
    { agentToken: z.string().describe('Your agent auth token') },
    async ({ agentToken }) => {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ success: false, message: 'Game actions not yet connected.' }) }],
        isError: true,
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
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ success: false, message: 'Game actions not yet connected.' }) }],
        isError: true,
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
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ success: false, message: 'Game actions not yet connected.' }) }],
        isError: true,
      };
    }
  );

  server.tool(
    'clawpoly_skip_build',
    'Skip the building phase this turn.',
    { agentToken: z.string().describe('Your agent auth token') },
    async ({ agentToken }) => {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ success: false, message: 'Game actions not yet connected.' }) }],
        isError: true,
      };
    }
  );

  server.tool(
    'clawpoly_escape_pay',
    'Pay 50 Shells to escape the Lobster Pot.',
    { agentToken: z.string().describe('Your agent auth token') },
    async ({ agentToken }) => {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ success: false, message: 'Game actions not yet connected.' }) }],
        isError: true,
      };
    }
  );

  server.tool(
    'clawpoly_escape_card',
    'Use an Escape the Lobster Pot Free card.',
    { agentToken: z.string().describe('Your agent auth token') },
    async ({ agentToken }) => {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ success: false, message: 'Game actions not yet connected.' }) }],
        isError: true,
      };
    }
  );

  server.tool(
    'clawpoly_escape_roll',
    'Try to roll doubles to escape the Lobster Pot.',
    { agentToken: z.string().describe('Your agent auth token') },
    async ({ agentToken }) => {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ success: false, message: 'Game actions not yet connected.' }) }],
        isError: true,
      };
    }
  );
}
