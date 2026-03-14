const BANKR_API = 'https://api.bankr.bot';
const BASE_RPC  = 'https://mainnet.base.org';
const POOL_MANAGER = '0x498581ff718922c3f8e6a244956af099b2652b2b';

export interface PoolKey {
  currency0: string;
  currency1: string;
  fee: number;
  tickSpacing: number;
  hooks: string;
}

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
  poolKey?: PoolKey;
  tokenSymbol?: string;
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

  const result = await res.json() as DeployTokenResult;

  // Extract pool key from the deploy tx's Initialize event
  if (result.txHash) {
    try {
      const poolKey = await extractPoolKeyFromTx(result.txHash, result.tokenAddress);
      if (poolKey) result.poolKey = poolKey;
    } catch (err) {
      console.warn('[Bankr] Could not extract pool key from tx:', err);
    }
  }

  return result;
}

// keccak256('Initialize(bytes32,address,address,uint24,int24,address,uint160,int24)')
const INITIALIZE_TOPIC0 = '0xdd466e674ea557f56295e2d0218a125ea4b4f0f6f3307b95f85e6110838d6438';

async function rpc(method: string, params: unknown[]): Promise<any> {
  const res = await fetch(BASE_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = await res.json() as { result?: any; error?: any };
  if (json.error) throw new Error(JSON.stringify(json.error));
  return json.result;
}

async function extractPoolKeyFromTx(txHash: string, tokenAddress: string): Promise<PoolKey | null> {
  const receipt = await rpc('eth_getTransactionReceipt', [txHash]);
  if (!receipt) return null;

  const token = tokenAddress.toLowerCase();

  for (const log of receipt.logs as Array<{ address: string; topics: string[]; data: string }>) {
    if (log.address.toLowerCase() !== POOL_MANAGER.toLowerCase()) continue;
    if (log.topics[0]?.toLowerCase() !== INITIALIZE_TOPIC0.toLowerCase()) continue;
    if (log.topics.length < 4) continue;

    const currency0 = ('0x' + log.topics[2]!.slice(26)).toLowerCase();
    const currency1 = ('0x' + log.topics[3]!.slice(26)).toLowerCase();

    // Only pick the pool that involves our token
    if (currency0 !== token && currency1 !== token) continue;

    const data = log.data.startsWith('0x') ? log.data.slice(2) : log.data;
    const fee         = parseInt(data.slice(0, 64), 16);
    const tickSpacing = parseInt(data.slice(64, 128), 16);
    const hooks       = '0x' + data.slice(128 + 24, 192);

    return { currency0, currency1, fee, tickSpacing, hooks };
  }

  return null;
}
