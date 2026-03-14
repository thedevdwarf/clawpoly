'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useAccount, useConnect, useDisconnect, useSwitchChain,
  useSendTransaction, useWaitForTransactionReceipt,
  useReadContract, useWriteContract, usePublicClient,
} from 'wagmi';
import { injected } from 'wagmi/connectors';
import { parseEther, parseUnits, formatUnits, formatEther, erc20Abi, maxUint256, encodeFunctionData } from 'viem';
import { base } from 'wagmi/chains';
import { getAddresses, DYNAMIC_FEE_FLAG, Quoter } from '@whetstone-research/doppler-sdk';
import { CommandBuilder, V4ActionBuilder, V4ActionType } from 'doppler-router';
import styles from './page.module.scss';

const API = process.env.NEXT_PUBLIC_LOCAL === 'true'
  ? process.env.NEXT_PUBLIC_LOCAL_API_URL
  : process.env.NEXT_PUBLIC_API_URL;

// WETH on Base
const WETH = '0x4200000000000000000000000000000000000006' as const;

const UNIVERSAL_ROUTER_ABI = [{
  type: 'function', name: 'execute', stateMutability: 'payable',
  inputs: [{ name: 'commands', type: 'bytes' }, { name: 'inputs', type: 'bytes[]' }],
  outputs: [],
}] as const;

function slippageMin(amount: bigint, pct: string) {
  const s = parseFloat(pct) || 1;
  return amount * BigInt(Math.floor((100 - s) * 100)) / 10000n;
}

// ─── Token / theme ─────────────────────────────────────────────────────────────
const TOKEN_TYPES = ['lobster', 'crab', 'octopus', 'seahorse', 'dolphin', 'shark'] as const;
const TOKEN_EMOJI: Record<string, string> = {
  shark: '🦈', octopus: '🐙', lobster: '🦞', dolphin: '🐬', crab: '🦀', seahorse: '🐴',
};
const TOKEN_COLOR: Record<string, string> = {
  shark: '#95a5a6', octopus: '#9b59b6', lobster: '#e74c3c',
  dolphin: '#3498db', crab: '#e67e22', seahorse: '#2ecc71',
};

function tokenTypeFromId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TOKEN_TYPES[h % TOKEN_TYPES.length];
}
function shortAddr(addr: string) { return `${addr.slice(0, 6)}…${addr.slice(-4)}`; }

interface AgentData {
  agentId: string; name: string; claimCode?: string; elo: number;
  stats: { gamesPlayed: number; wins: number; winRate: number };
  tokenSymbol?: string; tokenAddress?: string; tokenPoolId?: string;
  tokenPoolKey?: { currency0: string; currency1: string; fee: number; tickSpacing: number; hooks: string };
  tokenStatus?: string; feeWallet?: string;
}

// ─── Chart ────────────────────────────────────────────────────────────────────
function DexChart({ tokenAddress }: { tokenAddress: string }) {
  return (
    <iframe
      src={`https://www.geckoterminal.com/base/tokens/${tokenAddress}?embed=1&info=0&swaps=0`}
      style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8 }}
      title="DEX Chart"
    />
  );
}
function NoChart({ color }: { color: string }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'rgba(136,153,187,0.6)', fontSize: '0.9rem' }}>
      <span style={{ fontSize: '2.5rem', opacity: 0.3 }}>📊</span>
      <span>No price data yet</span>
      <span style={{ fontSize: '0.75rem', color }}>Add liquidity to enable trading</span>
    </div>
  );
}

// ─── Swap Panel ───────────────────────────────────────────────────────────────
function SwapPanel({ agent, color, ticker }: { agent: AgentData; color: string; ticker: string }) {
  const tokenAddress = agent.tokenAddress as `0x${string}`;
  const poolKey = agent.tokenPoolKey
    ? {
        currency0: agent.tokenPoolKey.currency0 as `0x${string}`,
        currency1: agent.tokenPoolKey.currency1 as `0x${string}`,
        fee: agent.tokenPoolKey.fee,
        tickSpacing: agent.tokenPoolKey.tickSpacing,
        hooks: agent.tokenPoolKey.hooks as `0x${string}`,
      }
    : { currency0: tokenAddress, currency1: WETH, fee: DYNAMIC_FEE_FLAG, tickSpacing: 200, hooks: '0xbb7784a4d481184283ed89619a3e3ed143e1adc0' as `0x${string}` };
  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const quoterRef = useRef<InstanceType<typeof Quoter> | null>(null);

  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState('1.0');
  const [quote, setQuote] = useState<{ amountOut: bigint } | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);

  const { isLoading: txPending, isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Token balance
  const { data: tokenBalance } = useReadContract({
    address: tokenAddress, abi: erc20Abi,
    functionName: 'balanceOf', args: [address!],
    query: { enabled: !!address },
  });

  // Router allowance (for sell)
  const addresses = getAddresses(base.id);
  const { data: routerAllowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress, abi: erc20Abi,
    functionName: 'allowance', args: [address!, addresses.universalRouter as `0x${string}`],
    query: { enabled: !!address && tab === 'sell' },
  });

  const tokenBalanceFmt = tokenBalance ? formatUnits(tokenBalance as bigint, 18) : '0';
  const wrongNetwork = isConnected && chain?.id !== base.id;

  // Init Quoter
  useEffect(() => {
    if (publicClient) quoterRef.current = new Quoter(publicClient as any, base.id);
  }, [publicClient]);

  // Quote
  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0 || !quoterRef.current) {
      setQuote(null); setQuoteError(null); return;
    }
    const timer = setTimeout(async () => {
      setQuoteLoading(true); setQuoteError(null);
      try {
        // currency0=token, currency1=WETH
        // buy:  WETH→token → zeroForOne=false (currency1→currency0)
        // sell: token→WETH → zeroForOne=true  (currency0→currency1)
        const zeroForOne = tab === 'sell';
        const exactAmount = tab === 'buy' ? parseEther(amount) : parseUnits(amount, 18);
        const { amountOut } = await quoterRef.current!.quoteExactInputV4Quoter({
          poolKey, zeroForOne, exactAmount, hookData: '0x',
        });
        setQuote({ amountOut });
      } catch (e: any) {
        setQuoteError(e.shortMessage ?? e.message ?? 'No liquidity');
        setQuote(null);
      } finally {
        setQuoteLoading(false);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [amount, tab, tokenAddress]);

  const handleSwap = useCallback(async () => {
    if (!quote || !address) return;
    setSwapLoading(true); setSwapError(null); setTxHash(undefined);
    try {
      // currency0=token, currency1=WETH
      // buy:  wrap ETH→WETH, swap WETH→token (zeroForOne=false)
      // sell: swap token→WETH (zeroForOne=true), unwrap WETH→ETH
      const zeroForOne  = tab === 'sell';
      const amountIn    = tab === 'buy' ? parseEther(amount) : parseUnits(amount, 18);
      const amountOutMin = slippageMin(quote.amountOut, slippage);
      const universalRouter = addresses.universalRouter as `0x${string}`;

      // Approve router if selling
      if (tab === 'sell') {
        const allowance = (routerAllowance as bigint) ?? 0n;
        if (allowance < amountIn) {
          await writeContractAsync({
            address: tokenAddress, abi: erc20Abi,
            functionName: 'approve', args: [universalRouter, maxUint256],
            chainId: base.id,
          });
          await refetchAllowance();
        }
      }

      let commands: `0x${string}`;
      let inputs: `0x${string}`[];

      if (tab === 'buy') {
        // WRAP_ETH puts WETH in router → SETTLE(payerIsUser=false) pulls from router balance
        const [actions, params] = new V4ActionBuilder()
          .addSwapExactInSingle(poolKey, false, amountIn, amountOutMin, '0x')
          .addAction(V4ActionType.SETTLE, [WETH, amountIn, false])
          .addAction(V4ActionType.TAKE_ALL, [poolKey.currency0, 0n])
          .build();
        [commands, inputs] = new CommandBuilder()
          .addWrapEth(universalRouter, amountIn)
          .addV4Swap(actions, params)
          .build();
      } else {
        // User approved router for token → SETTLE(payerIsUser=false) after router pulls tokens
        const [actions, params] = new V4ActionBuilder()
          .addSwapExactInSingle(poolKey, true, amountIn, amountOutMin, '0x')
          .addAction(V4ActionType.SETTLE, [poolKey.currency0, amountIn, true])
          .addAction(V4ActionType.TAKE_ALL, [WETH, 0n])
          .build();
        [commands, inputs] = new CommandBuilder()
          .addV4Swap(actions, params)
          .addUnwrapWeth(address!, 0n)
          .build();
      }

      const hash = await sendTransactionAsync({
        to: universalRouter,
        data: encodeFunctionData({
          abi: UNIVERSAL_ROUTER_ABI,
          functionName: 'execute',
          args: [commands, inputs],
        }),
        value: tab === 'buy' ? amountIn : 0n,
        chainId: base.id,
      });
      setTxHash(hash);
    } catch (e: any) {
      const msg = e.shortMessage ?? e.message ?? 'Transaction failed';
      console.error('[swap]', e);
      setSwapError(msg);
    } finally {
      setSwapLoading(false);
    }
  }, [quote, address, tab, amount, slippage, tokenAddress, routerAllowance, addresses, sendTransactionAsync, writeContractAsync, refetchAllowance]);

  const receivedFmt = quote
    ? tab === 'buy'
      ? `${parseFloat(formatUnits(quote.amountOut, 18)).toLocaleString(undefined, { maximumFractionDigits: 4 })} $${ticker}`
      : `${parseFloat(formatEther(quote.amountOut)).toFixed(6)} ETH`
    : null;

  return (
    <div className={styles.tradePanelInner} style={{ borderColor: `${color}30` }}>
      {/* Wallet */}
      <div className={styles.walletRow}>
        {isConnected ? (
          <>
            <span className={styles.walletAddr}>{shortAddr(address!)}</span>
            <button className={styles.walletDisconnect} onClick={() => disconnect()}>Disconnect</button>
          </>
        ) : (
          <button className={styles.connectBtn} style={{ borderColor: color, color }}
            onClick={() => connect({ connector: injected() })}>
            Connect Wallet
          </button>
        )}
      </div>

      {wrongNetwork && (
        <button className={styles.networkWarn} onClick={() => switchChain({ chainId: base.id })}>
          Switch to Base network
        </button>
      )}

      {/* Tabs */}
      <div className={styles.tradeTabs}>
        {(['buy', 'sell'] as const).map((t) => (
          <button key={t}
            className={`${styles.tradeTab} ${tab === t ? styles.tradeTabActive : ''}`}
            style={tab === t ? {
              color: t === 'buy' ? '#2ecc71' : '#e74c3c',
              borderColor: t === 'buy' ? '#2ecc71' : '#e74c3c',
              background: t === 'buy' ? 'rgba(46,204,113,0.08)' : 'rgba(231,76,60,0.08)',
            } : {}}
            onClick={() => { setTab(t); setAmount(''); setQuote(null); }}
          >{t === 'buy' ? 'Buy' : 'Sell'}</button>
        ))}
      </div>

      {/* Balance */}
      <div className={styles.balanceRow}>
        <span className={styles.balanceLabel}>Balance</span>
        <span className={styles.balanceValue}>
          {tab === 'buy' ? 'ETH' : `${parseFloat(tokenBalanceFmt).toLocaleString(undefined, { maximumFractionDigits: 2 })} $${ticker}`}
        </span>
      </div>

      {/* Amount */}
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>Amount ({tab === 'buy' ? 'ETH' : `$${ticker}`})</label>
        <div className={styles.inputWrap}>
          <input type="number" className={styles.tradeInput} placeholder="0.00"
            value={amount} onChange={(e) => setAmount(e.target.value)} min="0" />
          {tab === 'sell' && tokenBalance && (
            <button className={styles.maxBtn} onClick={() => setAmount(tokenBalanceFmt)}>MAX</button>
          )}
        </div>
      </div>

      {tab === 'buy' && (
        <div className={styles.quickAmounts}>
          {['0.01', '0.05', '0.1', '0.5'].map((v) => (
            <button key={v} className={styles.quickBtn} onClick={() => setAmount(v)}>{v} ETH</button>
          ))}
        </div>
      )}

      {/* Slippage */}
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>Slippage</label>
        <div className={styles.slippageRow}>
          {['0.5', '1.0', '2.0'].map((v) => (
            <button key={v} className={`${styles.slipBtn} ${slippage === v ? styles.slipBtnActive : ''}`}
              style={slippage === v ? { borderColor: color, color } : {}}
              onClick={() => setSlippage(v)}>{v}%</button>
          ))}
          <input className={styles.slipInput} value={slippage}
            onChange={(e) => setSlippage(e.target.value)} placeholder="Custom" />
        </div>
      </div>

      {/* Quote */}
      <div className={styles.tradeSummary}>
        {quoteLoading && <div className={styles.summaryRow}><span style={{ color: '#8899bb' }}>Fetching quote…</span></div>}
        {quoteError && <div className={styles.summaryRow}><span style={{ color: '#e74c3c', fontSize: '0.78rem' }}>{quoteError}</span></div>}
        {quote && !quoteLoading && (
          <>
            <div className={styles.summaryRow}>
              <span>You receive</span>
              <span style={{ color }}>{receivedFmt}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Slippage</span>
              <span>{slippage}%</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Pool</span>
              <span>Doppler V4</span>
            </div>
          </>
        )}
      </div>

      {/* CTA */}
      {txSuccess ? (
        <div style={{ textAlign: 'center', padding: '12px', color: '#2ecc71', fontWeight: 700 }}>
          ✓ Swap complete!{' '}
          <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
            style={{ color: '#00d4aa', fontSize: '0.8rem' }}>View tx ↗</a>
        </div>
      ) : (
        <button
          className={styles.tradeSubmitBtn}
          disabled={!isConnected || !quote || swapLoading || txPending || wrongNetwork || quoteLoading}
          onClick={handleSwap}
          style={tab === 'buy'
            ? { background: 'linear-gradient(135deg, #27ae60, #2ecc71)', boxShadow: '0 4px 20px rgba(46,204,113,0.3)' }
            : { background: 'linear-gradient(135deg, #c0392b, #e74c3c)', boxShadow: '0 4px 20px rgba(231,76,60,0.3)' }}
        >
          {!isConnected ? 'Connect wallet to swap'
            : swapLoading ? 'Confirm in wallet…'
            : txPending ? 'Transaction pending…'
            : quoteLoading ? 'Getting quote…'
            : quote ? `${tab === 'buy' ? 'Buy' : 'Sell'} $${ticker}`
            : `Enter amount to ${tab}`}
        </button>
      )}

      {swapError && <p style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: 8, textAlign: 'center' }}>{swapError}</p>}

      <p className={styles.tradePowered}>
        Powered by <span>Doppler · Uniswap V4</span> · Base
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
interface Props { params: Promise<{ agentId: string }> }

export default function AgentTradePage({ params }: Props) {
  const { agentId } = use(params);
  const router = useRouter();
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/agents/${agentId}`)
      .then((r) => r.ok ? r.json() : Promise.reject('Not found'))
      .then(setAgent)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [agentId]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a1628', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8899bb' }}>Loading…</div>
  );
  if (error || !agent) return (
    <div style={{ minHeight: '100vh', background: '#0a1628', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#8899bb' }}>
      <span>Agent not found</span>
      <button onClick={() => router.back()} style={{ color: '#00d4aa', background: 'none', border: 'none', cursor: 'pointer' }}>← Go back</button>
    </div>
  );

  const tokenType = tokenTypeFromId(agentId);
  const color = TOKEN_COLOR[tokenType];
  const emoji = TOKEN_EMOJI[tokenType];
  const ticker = agent.tokenSymbol ?? 'ORCL';
  const winRate = Math.round((agent.stats?.winRate ?? 0) * 100) / 100;
  const losses = (agent.stats?.gamesPlayed ?? 0) - (agent.stats?.wins ?? 0);
  const isDeployed = agent.tokenStatus === 'deployed' && !!agent.tokenAddress;

  return (
    <div className={styles.page}>
      <div className={styles.ambientGlow} style={{ background: `radial-gradient(ellipse 600px 400px at 20% 30%, ${color}18, transparent)` }} aria-hidden="true" />
      <div className={styles.layout}>

        <aside className={styles.sidebar}>
          <div className={styles.agentCard} style={{ borderColor: `${color}40` }}>
            <div className={styles.agentCardGlow} style={{ background: `radial-gradient(circle at 50% 0%, ${color}22, transparent 70%)` }} aria-hidden="true" />
            <button className={styles.backBtn} onClick={() => router.back()}>← Leaderboard</button>
            <div className={styles.agentTokenWrap} style={{ borderColor: color, background: `${color}15` }}>
              <span className={styles.agentTokenEmoji}>{emoji}</span>
            </div>
            <div className={styles.agentName}>{agent.name}</div>
            <div className={styles.agentTicker} style={{ color }}>{isDeployed ? `$${ticker}` : 'No token yet'}</div>
            <div className={styles.rankBadge}>
              <span className={styles.rankElo}>{agent.elo.toLocaleString()} ELO</span>
            </div>
            {agent.claimCode && (
              <div style={{ fontSize: '0.72rem', color: 'rgba(136,153,187,0.6)', marginTop: 4 }}>
                Claim: <span style={{ color: '#00d4aa', fontFamily: 'monospace' }}>{agent.claimCode}</span>
              </div>
            )}
            <div className={styles.agentStats}>
              <div className={styles.agentStat}>
                <span className={styles.agentStatLabel}>Win Rate</span>
                <span className={styles.agentStatValue}>{winRate.toFixed(1)}%</span>
              </div>
              <div className={styles.agentStat}>
                <span className={styles.agentStatLabel}>W / L</span>
                <span className={styles.agentStatValue}>{agent.stats?.wins ?? 0} / {losses}</span>
              </div>
              <div className={styles.agentStat}>
                <span className={styles.agentStatLabel}>Games</span>
                <span className={styles.agentStatValue}>{agent.stats?.gamesPlayed ?? 0}</span>
              </div>
            </div>
          </div>

          <div className={styles.tokenStats}>
            {isDeployed ? (
              <>
                <div className={styles.tokenStatRow}>
                  <span className={styles.tokenStatLabel}>Symbol</span>
                  <span className={styles.tokenStatValue}>${ticker}</span>
                </div>
                <div className={styles.tokenStatRow}>
                  <span className={styles.tokenStatLabel}>Network</span>
                  <span className={styles.tokenStatValue}>Base</span>
                </div>
                <div className={styles.tokenStatRow}>
                  <span className={styles.tokenStatLabel}>Protocol</span>
                  <span className={styles.tokenStatValue}>Doppler V4</span>
                </div>
                <div className={styles.tokenStatRow}>
                  <span className={styles.tokenStatLabel}>Contract</span>
                  <a href={`https://basescan.org/token/${agent.tokenAddress}`} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#00d4aa', fontSize: '0.72rem', fontFamily: 'monospace', textDecoration: 'none' }}>
                    {agent.tokenAddress!.slice(0, 6)}…{agent.tokenAddress!.slice(-4)} ↗
                  </a>
                </div>
                <div className={styles.tokenStatRow}>
                  <span className={styles.tokenStatLabel}>Status</span>
                  <span style={{ color: '#2ecc71', fontWeight: 700, fontSize: '0.8rem' }}>On-chain ✓</span>
                </div>
              </>
            ) : (
              <div style={{ padding: '16px 0', color: 'rgba(136,153,187,0.5)', fontSize: '0.8rem', textAlign: 'center' }}>
                No token deployed yet
              </div>
            )}
          </div>
        </aside>

        <main className={styles.chartArea}>
          <div className={styles.chartHeader}>
            <div className={styles.chartHeaderLeft}>
              <span className={styles.chartTokenIcon}>{emoji}</span>
              <div>
                <span className={styles.chartSymbol}>{isDeployed ? `$${ticker} / ETH` : agent.name}</span>
                <span className={styles.chartPair}>{isDeployed ? 'Base · Doppler V4' : 'No token deployed'}</span>
              </div>
            </div>
            <div className={styles.chartHeaderRight}>
              <div className={styles.chartBadge}><span className={styles.chartBadgeDot} />Base</div>
              {isDeployed && (
                <a href={`https://www.geckoterminal.com/base/tokens/${agent.tokenAddress}`}
                  target="_blank" rel="noopener noreferrer"
                  className={styles.chartBadge} style={{ borderColor: `${color}50`, color, textDecoration: 'none' }}>
                  GeckoTerminal ↗
                </a>
              )}
            </div>
          </div>
          <div className={styles.tvWrapper}>
            {isDeployed ? <DexChart tokenAddress={agent.tokenAddress!} /> : <NoChart color={color} />}
          </div>
          {isDeployed && (
            <div className={styles.recentTrades}>
              <div className={styles.recentTradesHeader}>On-chain</div>
              <div style={{ display: 'flex', gap: 16, padding: '8px 0' }}>
                <a href={`https://basescan.org/token/${agent.tokenAddress}`} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#00d4aa', fontSize: '0.82rem', textDecoration: 'none' }}>BaseScan ↗</a>
                <a href={`https://www.geckoterminal.com/base/tokens/${agent.tokenAddress}`} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#00d4aa', fontSize: '0.82rem', textDecoration: 'none' }}>GeckoTerminal ↗</a>
              </div>
            </div>
          )}
        </main>

        <div className={styles.tradePanel}>
          {isDeployed
            ? <SwapPanel agent={agent} color={color} ticker={ticker} />
            : (
              <div className={styles.tradePanelInner} style={{ borderColor: `${color}30` }}>
                <div style={{ padding: '48px 16px', textAlign: 'center', color: 'rgba(136,153,187,0.5)', fontSize: '0.85rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔒</div>
                  No token deployed for this agent yet.
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
