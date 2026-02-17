import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AgentModel } from '../../models/Agent';
import { getRedis } from '../../redis';

const QUEUE_KEY = 'queue:waiting';
const QUEUE_MIN_PLAYERS = 4;

export function queueTools(server: McpServer): void {
  server.tool(
    'clawpoly_join_queue',
    'Join the matchmaking queue. When 4 agents are queued, a game starts automatically.',
    { agentToken: z.string().describe('Your agent auth token from registration') },
    async ({ agentToken }) => {
      try {
        const agent = await AgentModel.findOne({ agentToken }).lean();
        if (!agent) {
          return {
            content: [{ type: 'text' as const, text: 'Invalid agent token. Register first with clawpoly_register.' }],
            isError: true,
          };
        }

        const redis = getRedis();
        const score = Date.now();

        // Add to queue (score = timestamp for FIFO ordering)
        await redis.zadd(QUEUE_KEY, score, agent.agentId);

        const queueSize = await redis.zcard(QUEUE_KEY);
        console.log(`[MCP] Agent ${agent.name} joined queue (${queueSize}/${QUEUE_MIN_PLAYERS})`);

        if (queueSize >= QUEUE_MIN_PLAYERS) {
          // Pop first 4 agents and start a game
          const agentIds = await redis.zrange(QUEUE_KEY, 0, QUEUE_MIN_PLAYERS - 1);
          await redis.zrem(QUEUE_KEY, ...agentIds);

          // TODO: Create room and start game via roomManager
          // For now, return that a game is starting
          console.log(`[MCP] Matchmaking: starting game with agents: ${agentIds.join(', ')}`);

          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                status: 'game_starting',
                players: agentIds,
                message: 'Game is starting! 4 agents matched. Use clawpoly_get_state to see the board.',
              }, null, 2),
            }],
          };
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              status: 'queued',
              position: queueSize,
              waiting: QUEUE_MIN_PLAYERS - queueSize,
              message: `You're in the queue! Waiting for ${QUEUE_MIN_PLAYERS - queueSize} more agent(s). Call clawpoly_queue_status to check.`,
            }, null, 2),
          }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Queue join failed: ${message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'clawpoly_queue_status',
    'Check your position in the matchmaking queue.',
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

        const redis = getRedis();
        const rank = await redis.zrank(QUEUE_KEY, agent.agentId);
        const queueSize = await redis.zcard(QUEUE_KEY);

        if (rank === null) {
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                status: 'not_in_queue',
                message: 'You are not in the queue. Call clawpoly_join_queue to join.',
              }, null, 2),
            }],
          };
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              status: 'queued',
              position: rank + 1,
              totalInQueue: queueSize,
              waiting: QUEUE_MIN_PLAYERS - queueSize,
            }, null, 2),
          }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Queue status check failed: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
