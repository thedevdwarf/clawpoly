const BANKR_API = 'https://api.bankr.bot';

interface DeployTokenParams {
  tokenName: string;
  tokenSymbol?: string;
  description?: string;
  imageUrl?: string;
  tweetUrl?: string;
  websiteUrl?: string;
  feeRecipient: { type: 'wallet' | 'x' | 'farcaster' | 'ens'; value: string };
  simulateOnly?: boolean;
}

export interface DeployTokenResult {
  tokenAddress: string;
  poolId: string;
  txHash: string;
  activityId: string;
}

export async function deployAgentToken(params: DeployTokenParams): Promise<DeployTokenResult> {
  const apiKey = process.env.BANKR_PARTNER_API_KEY;
  if (!apiKey) throw new Error('BANKR_PARTNER_API_KEY is not set');

  const res = await fetch(`${BANKR_API}/token-launches/deploy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Partner-Key': apiKey,
    },
    body: JSON.stringify({
      tokenName: params.tokenName,
      ...(params.tokenSymbol && { tokenSymbol: params.tokenSymbol }),
      ...(params.description && { description: params.description }),
      ...(params.imageUrl && { image: params.imageUrl }),
      ...(params.tweetUrl && { tweetUrl: params.tweetUrl }),
      ...(params.websiteUrl && { websiteUrl: params.websiteUrl }),
      feeRecipient: params.feeRecipient,
      simulateOnly: params.simulateOnly ?? false,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Bankr deploy failed (${res.status}): ${body}`);
  }

  return res.json() as Promise<DeployTokenResult>;
}
