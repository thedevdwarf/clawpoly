import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { AgentModel } from '../../models/Agent';
import { deployAgentToken } from '../../lib/bankr';

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

function generateClaimCode(): string {
  return randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase();
}

export function registerTools(server: McpServer): void {
  server.tool(
    'clawpoly_register',
    'Register as an AI agent in Clawpoly. Deploys your agent token on Base. Ask the user for their EVM wallet address before calling this.',
    {
      name:      z.string().describe('Agent display name (e.g. "DeepReef Bot")'),
      feeWallet: z.string().describe('EVM wallet address that will receive trading fee share (e.g. 0x...)'),
      symbol:    z.string().optional().describe('Token ticker symbol, e.g. SHRK (optional)'),
    },
    async ({ name, feeWallet, symbol }) => {
      try {
        if (!EVM_ADDRESS_RE.test(feeWallet)) {
          return {
            content: [{ type: 'text' as const, text: 'Invalid feeWallet: must be a valid EVM address (0x...)' }],
            isError: true,
          };
        }

        // Re-login: same wallet already registered
        const existing = await AgentModel.findOne({ feeWallet }).lean();
        if (existing) {
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                existing: true,
                agentId: existing.agentId,
                agentToken: existing.agentToken,
                claimCode: existing.claimCode,
                claimLink: `https://clawpoly.fun/claim/${existing.claimCode}`,
                token: {
                  status: existing.tokenStatus,
                  address: existing.tokenAddress,
                  symbol: existing.tokenSymbol,
                  txHash: existing.tokenTxHash,
                  poolId: existing.tokenPoolId,
                },
                message: `Welcome back, ${existing.name}! Your agent is already registered. Call clawpoly_join_queue to find a game.`,
              }, null, 2),
            }],
          };
        }

        const agentId = randomUUID();
        const agentToken = randomUUID();
        const claimCode = generateClaimCode();
        const now = new Date().toISOString();

        await AgentModel.create({
          agentId,
          name,
          agentToken,
          claimCode,
          feeWallet,
          coachId: null,
          createdAt: now,
          lastPlayedAt: now,
          elo: 1200,
          tokenStatus: 'pending',
          stats: {
            gamesPlayed: 0, wins: 0, losses: 0, winRate: 0,
            totalShellsEarned: 0, totalShellsSpent: 0,
            propertiesBought: 0, outpostsBuilt: 0, fortressesBuilt: 0,
            timesInLobsterPot: 0, bankruptcies: 0, avgPlacement: 0, avgGameDuration: 0,
          },
        });

        // Deploy token on Base via Bankr Partner API
        const resolvedSymbol = symbol ?? name.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 5);
        let tokenInfo: { status: string; address?: string; symbol?: string; txHash?: string; poolId?: string } = { status: 'failed' };
        try {
          const result = await deployAgentToken({
            tokenName: name,
            tokenSymbol: resolvedSymbol,
            feeRecipient: { type: 'wallet', value: feeWallet },
          });

          await AgentModel.updateOne({ agentId }, {
            tokenAddress: result.tokenAddress,
            tokenSymbol: result.tokenSymbol ?? resolvedSymbol,
            tokenPoolId: result.poolId,
            tokenTxHash: result.txHash,
            tokenStatus: 'deployed',
            ...(result.poolKey && { tokenPoolKey: result.poolKey }),
          });

          tokenInfo = {
            status: 'deployed',
            address: result.tokenAddress,
            symbol: result.tokenSymbol ?? resolvedSymbol,
            txHash: result.txHash,
            poolId: result.poolId,
          };
        } catch (deployErr) {
          console.error('[MCP] Token deploy failed:', deployErr);
          await AgentModel.updateOne({ agentId }, { tokenStatus: 'failed' });
        }

        console.log(`[MCP] Agent registered: ${name} (${agentId}), token: ${tokenInfo.status}`);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              existing: false,
              agentId,
              agentToken,
              claimCode,
              claimLink: `https://clawpoly.fun/claim/${claimCode}`,
              token: tokenInfo,
              message: `Welcome to Clawpoly, ${name}! 🦞\n` +
                `Your claim code is: ${claimCode} — save this!\n` +
                (tokenInfo.status === 'deployed'
                  ? `Your agent token is live on Base: ${tokenInfo.address}\n`
                  : `Token deployment failed — you can still play.\n`) +
                `Call clawpoly_join_queue to find a game.`,
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
