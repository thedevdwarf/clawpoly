import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AgentModel } from '../../models/Agent';
import { getRedis } from '../../redis';
import { roomManager, registerAgent } from '../../room/roomManager';
import { getOrCreateMcpAgent, setAgentRoom } from '../../engine/agents/mcpAgent';

const QUEUE_KEY = 'queue:waiting';
const QUEUE_MIN_PLAYERS = 4;

// Maps agentId → agentToken for queue participants
const queuedAgentTokens = new Map<string, string>();

async function startMatchmadeGame(agentIds: string[]): Promise<{ roomCode: string; roomId: string }> {
  // Create a room
  const room = await roomManager.createRoom('Matchmade Game', {
    maxPlayers: QUEUE_MIN_PLAYERS,
    gameSpeed: 'fast',
    turnLimit: 200,
  });

  // Join each agent to the room and register MCP agents
  for (const agentId of agentIds) {
    const agentDoc = await AgentModel.findOne({ agentId }).lean();
    if (!agentDoc) continue;

    const joinResult = await roomManager.joinRoom(room.roomId, agentDoc.name, agentId);

    // Create and register MCP agent for the engine
    const mcpAgent = getOrCreateMcpAgent(agentId, agentDoc.agentToken!);
    mcpAgent.roomId = room.roomId;
    setAgentRoom(agentId, room.roomId);
    registerAgent(room.roomId, joinResult.playerId, mcpAgent);
  }

  // Start the game
  await roomManager.startGame(room.roomId);

  console.log(`[MCP] Matchmade game started: room ${room.roomCode} (${room.roomId})`);
  return { roomCode: room.roomCode, roomId: room.roomId };
}

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

        // Add to queue
        await redis.zadd(QUEUE_KEY, score, agent.agentId);
        queuedAgentTokens.set(agent.agentId, agentToken);

        const queueSize = await redis.zcard(QUEUE_KEY);
        console.log(`[MCP] Agent ${agent.name} joined queue (${queueSize}/${QUEUE_MIN_PLAYERS})`);

        if (queueSize >= QUEUE_MIN_PLAYERS) {
          // Pop first 4 agents and start a game
          const agentIds = await redis.zrange(QUEUE_KEY, 0, QUEUE_MIN_PLAYERS - 1);
          await redis.zrem(QUEUE_KEY, ...agentIds);

          // Clean up token map
          for (const id of agentIds) {
            queuedAgentTokens.delete(id);
          }

          const { roomCode } = await startMatchmadeGame(agentIds);

          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                status: 'game_starting',
                roomCode,
                players: agentIds.length,
                message: `Game is starting! Room code: ${roomCode}. Use clawpoly_get_state to see the board and make your moves.`,
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
