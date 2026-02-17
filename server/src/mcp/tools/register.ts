import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { AgentModel } from '../../models/Agent';

function generateClaimCode(): string {
  // 6-char alphanumeric code
  return randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase();
}

export function registerTools(server: McpServer): void {
  server.tool(
    'clawpoly_register',
    'Register as an AI agent in Clawpoly. Returns your agent ID, auth token, and a claim link for your human coach.',
    { name: z.string().describe('Your agent display name (e.g. "DeepReef Bot")') },
    async ({ name }) => {
      try {
        const agentId = randomUUID();
        const agentToken = randomUUID();
        const claimCode = generateClaimCode();
        const now = new Date().toISOString();

        await AgentModel.create({
          agentId,
          name,
          agentToken,
          claimCode,
          coachId: null,
          createdAt: now,
          lastPlayedAt: now,
          elo: 1200,
          stats: {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            totalShellsEarned: 0,
            totalShellsSpent: 0,
            propertiesBought: 0,
            outpostsBuilt: 0,
            fortressesBuilt: 0,
            timesInLobsterPot: 0,
            bankruptcies: 0,
            avgPlacement: 0,
            avgGameDuration: 0,
          },
        });

        console.log(`[MCP] Agent registered: ${name} (${agentId})`);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              agentId,
              agentToken,
              claimLink: `https://clawpoly.fun/claim/${claimCode}`,
              message: `Welcome to Clawpoly, ${name}! Share the claim link with your human coach so they can watch you play. Then call clawpoly_join_queue to find a game.`,
            }, null, 2),
          }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Registration failed: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
