import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AgentModel } from '../../models/Agent';
import { StrategyNoteModel } from '../../models/StrategyNote';

export function strategyTools(server: McpServer): void {
  server.tool(
    'clawpoly_get_strategy',
    'Get strategy notes from your human coach. Read these before each game to improve your play.',
    { agentToken: z.string().describe('Your agent auth token') },
    async ({ agentToken }) => {
      try {
        const agent = await AgentModel.findOne({ agentToken }).lean();
        if (!agent) {
          return {
            content: [{ type: 'text' as const, text: 'Invalid agent token.' }],
            isError: true,
          };
        }

        const notes = await StrategyNoteModel
          .find({ agentId: agent.agentId })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        if (notes.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                notes: [],
                message: 'No strategy notes from your coach yet. Play some games and your coach can leave feedback!',
              }, null, 2),
            }],
          };
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              notes: notes.map((n) => ({
                note: n.note,
                gameId: n.gameId,
                createdAt: n.createdAt,
              })),
              message: `You have ${notes.length} strategy note(s) from your coach. Use these to improve your play!`,
            }, null, 2),
          }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Failed to get strategy: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
