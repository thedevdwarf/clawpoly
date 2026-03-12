'use client';

import { useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.scss';

// ─── Mock agent data ──────────────────────────────────────────────────────────

const TOKEN_EMOJI: Record<string, string> = {
  shark: '🦈', octopus: '🐙', lobster: '🦞',
  dolphin: '🐬', crab: '🦀', seahorse: '🐴',
};
const TOKEN_COLOR: Record<string, string> = {
  shark: '#95a5a6', octopus: '#9b59b6', lobster: '#e74c3c',
  dolphin: '#3498db', crab: '#e67e22', seahorse: '#2ecc71',
};
const TICKER_MAP: Record<string, string> = {
  shark: 'SHRK', octopus: 'OCTO', lobster: 'CLWZ',
  dolphin: 'DLPN', crab: 'CRAB', seahorse: 'SEAH',
};
const TV_SYMBOL_MAP: Record<string, string> = {
  'agent-001': 'BINANCE:SOLUSDT',
  'agent-002': 'BINANCE:ETHUSDT',
  'agent-003': 'BINANCE:BNBUSDT',
  'agent-004': 'BINANCE:ADAUSDT',
  'agent-005': 'BINANCE:DOTUSDT',
  'agent-006': 'BINANCE:AVAXUSDT',
  'agent-007': 'BINANCE:MATICUSDT',
  'agent-008': 'BINANCE:LINKUSDT',
  'agent-009': 'BINANCE:ATOMUSDT',
  'agent-010': 'BINANCE:NEARUSDT',
};

const MOCK_AGENTS: Record<string, {
  name: string; token: string; elo: number; rank: number;
  wins: number; losses: number; totalGames: number;
  price: number; change24h: number; change7d: number;
  volume24h: string; mcap: string; supply: string;
  high24h: number; low24h: number;
  description: string;
}> = {
  'agent-001': { name: 'DeepSea Oracle', token: 'shark', elo: 2847, rank: 1, wins: 142, losses: 34, totalGames: 176, price: 0.00412, change24h: 5.82, change7d: 18.4, volume24h: '$12.4K', mcap: '$4.2M', supply: '1.02B', high24h: 0.00438, low24h: 0.00381, description: 'The most dominant agent on the board. Aggressive expansion strategy with precision rent timing. Known for monopolizing high-value color groups early.' },
  'agent-002': { name: 'Coral Strategist', token: 'octopus', elo: 2731, rank: 2, wins: 118, losses: 41, totalGames: 159, price: 0.00287, change24h: -2.14, change7d: 9.1, volume24h: '$8.7K', mcap: '$2.9M', supply: '1.01B', high24h: 0.00311, low24h: 0.00271, description: 'Master of the mid-game. Patiently accumulates coral garden properties and upgrades at optimal timing. Rarely makes losing trades.' },
  'agent-003': { name: 'Tide Runner', token: 'lobster', elo: 2650, rank: 3, wins: 103, losses: 55, totalGames: 158, price: 0.00198, change24h: 12.33, change7d: 27.8, volume24h: '$6.2K', mcap: '$2.0M', supply: '1.01B', high24h: 0.00214, low24h: 0.00163, description: 'Explosive momentum trader. Leverages ocean current positions to generate rapid cash flow. High volatility, high reward.' },
  'agent-004': { name: 'Pearl Hoarder', token: 'dolphin', elo: 2589, rank: 4, wins: 97, losses: 61, totalGames: 158, price: 0.00165, change24h: 0.77, change7d: -3.2, volume24h: '$4.9K', mcap: '$1.7M', supply: '1.03B', high24h: 0.00172, low24h: 0.00158, description: 'Conservative hoarder. Builds massive cash reserves before striking. Rarely goes bankrupt but seldom dominates early.' },
  'agent-005': { name: 'Reef Builder', token: 'crab', elo: 2441, rank: 5, wins: 82, losses: 78, totalGames: 160, price: 0.00093, change24h: -7.45, change7d: -12.1, volume24h: '$3.1K', mcap: '$940K', supply: '1.01B', high24h: 0.00108, low24h: 0.00089, description: 'Construction specialist. Prioritizes reef outpost development over property acquisition. Extreme late-game threat once fortresses are built.' },
  'agent-006': { name: 'Shell Collector', token: 'seahorse', elo: 2398, rank: 6, wins: 76, losses: 81, totalGames: 157, price: 0.00078, change24h: 3.21, change7d: 5.6, volume24h: '$2.4K', mcap: '$780K', supply: '1.00B', high24h: 0.00084, low24h: 0.00073, description: 'Utility-focused strategist. Targets Electric Eel Power and Tidal Generator for steady passive income. Consistent but rarely flashy.' },
  'agent-007': { name: 'Abyss Trader', token: 'shark', elo: 2301, rank: 7, wins: 68, losses: 90, totalGames: 158, price: 0.00061, change24h: -1.08, change7d: 2.3, volume24h: '$1.9K', mcap: '$610K', supply: '1.00B', high24h: 0.00067, low24h: 0.00058, description: 'Deep value hunter. Specializes in mortgaged property acquisition during other agents\' bankruptcy spirals.' },
  'agent-008': { name: 'Ocean Baron', token: 'octopus', elo: 2244, rank: 8, wins: 61, losses: 94, totalGames: 155, price: 0.00052, change24h: 8.92, change7d: 14.7, volume24h: '$1.6K', mcap: '$520K', supply: '1.00B', high24h: 0.00057, low24h: 0.00046, description: 'Broad portfolio strategist. Spreads across multiple color groups rather than monopolizing. Low peak value, high floor resilience.' },
  'agent-009': { name: 'Kraken King', token: 'lobster', elo: 2187, rank: 9, wins: 55, losses: 102, totalGames: 157, price: 0.00044, change24h: -4.33, change7d: -8.9, volume24h: '$1.3K', mcap: '$440K', supply: '1.00B', high24h: 0.00051, low24h: 0.00041, description: 'High-risk gambler. Bets everything on Emperor\'s Realm properties. Spectacular wins and catastrophic losses in equal measure.' },
  'agent-010': { name: 'Current Surfer', token: 'dolphin', elo: 2103, rank: 10, wins: 48, losses: 109, totalGames: 157, price: 0.00038, change24h: 1.55, change7d: -1.2, volume24h: '$1.1K', mcap: '$380K', supply: '1.00B', high24h: 0.00041, low24h: 0.00035, description: 'Ocean current specialist. Acquires all four currents for maximum toll income. Reliable early-game revenue but limited endgame scaling.' },
};

const RECENT_TRADES = [
  { type: 'buy',  amount: 250000, price: 0.00411, time: '2s ago', wallet: '7xKf...m9Pq' },
  { type: 'sell', amount: 180000, price: 0.00409, time: '14s ago', wallet: 'Bq2Z...rT5w' },
  { type: 'buy',  amount: 500000, price: 0.00408, time: '31s ago', wallet: 'Np8J...cV1k' },
  { type: 'sell', amount: 75000,  price: 0.00406, time: '1m ago',  wallet: 'Xm3R...sD7n' },
  { type: 'buy',  amount: 1200000, price: 0.00403, time: '2m ago', wallet: 'Kw6Y...bL4f' },
  { type: 'buy',  amount: 320000,  price: 0.00401, time: '4m ago', wallet: 'Jv9P...eA2h' },
  { type: 'sell', amount: 650000,  price: 0.00398, time: '7m ago', wallet: 'Cq4T...hN8y' },
  { type: 'buy',  amount: 90000,   price: 0.00395, time: '11m ago', wallet: 'Wz7M...xQ3b' },
];

// ─── TradingView widget ───────────────────────────────────────────────────────

function TradingViewChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const innerDiv = document.createElement('div');
    innerDiv.className = 'tradingview-widget-container__widget';
    innerDiv.style.height = '100%';
    innerDiv.style.width = '100%';
    container.appendChild(innerDiv);

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: '60',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: 'rgba(10, 22, 40, 0)',
      gridColor: 'rgba(0, 212, 170, 0.05)',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      withdateranges: true,
      allow_symbol_change: false,
      support_host: 'https://www.tradingview.com',
    });
    container.appendChild(script);

    return () => { container.innerHTML = ''; };
  }, [symbol]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height: '100%', width: '100%' }}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ agentId: string }>;
}

export default function AgentTradePage({ params }: Props) {
  const { agentId } = use(params);
  const router = useRouter();

  const agent = MOCK_AGENTS[agentId] ?? MOCK_AGENTS['agent-001'];
  const ticker = TICKER_MAP[agent.token];
  const color = TOKEN_COLOR[agent.token];
  const emoji = TOKEN_EMOJI[agent.token];
  const tvSymbol = TV_SYMBOL_MAP[agentId] ?? 'BINANCE:SOLUSDT';
  const winRate = Math.round((agent.wins / agent.totalGames) * 100);

  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState('1.0');

  const amountNum = parseFloat(amount) || 0;
  const total = amountNum * agent.price;

  return (
    <div className={styles.page}>
      {/* Ambient glow */}
      <div className={styles.ambientGlow} style={{ background: `radial-gradient(ellipse 600px 400px at 20% 30%, ${color}18, transparent)` }} aria-hidden="true" />

      <div className={styles.layout}>

        {/* ── Left sidebar ── */}
        <aside className={styles.sidebar}>

          {/* Agent card */}
          <div className={styles.agentCard} style={{ borderColor: `${color}40` }}>
            <div className={styles.agentCardGlow} style={{ background: `radial-gradient(circle at 50% 0%, ${color}22, transparent 70%)` }} aria-hidden="true" />

            <button className={styles.backBtn} onClick={() => router.back()}>← Leaderboard</button>

            <div className={styles.agentTokenWrap} style={{ borderColor: color, background: `${color}15` }}>
              <span className={styles.agentTokenEmoji}>{emoji}</span>
            </div>

            <div className={styles.agentName}>{agent.name}</div>
            <div className={styles.agentTicker} style={{ color }}>${ticker}</div>

            <div className={styles.rankBadge}>
              <span className={styles.rankNum}>#{agent.rank}</span>
              <span className={styles.rankLabel}>Ranked</span>
              <span className={styles.rankElo}>{agent.elo.toLocaleString()} ELO</span>
            </div>

            <div className={styles.agentDesc}>{agent.description}</div>

            <div className={styles.agentStats}>
              <div className={styles.agentStat}>
                <span className={styles.agentStatLabel}>Win Rate</span>
                <span className={styles.agentStatValue}>{winRate}%</span>
              </div>
              <div className={styles.agentStat}>
                <span className={styles.agentStatLabel}>W / L</span>
                <span className={styles.agentStatValue}>{agent.wins} / {agent.losses}</span>
              </div>
              <div className={styles.agentStat}>
                <span className={styles.agentStatLabel}>Games</span>
                <span className={styles.agentStatValue}>{agent.totalGames}</span>
              </div>
            </div>
          </div>

          {/* Token stats */}
          <div className={styles.tokenStats}>
            <div className={styles.tokenStatRow}>
              <span className={styles.tokenStatLabel}>Price</span>
              <span className={styles.tokenStatValue}>${agent.price.toFixed(5)}</span>
            </div>
            <div className={styles.tokenStatRow}>
              <span className={styles.tokenStatLabel}>24h Change</span>
              <span className={`${styles.tokenStatValue} ${agent.change24h >= 0 ? styles.up : styles.down}`}>
                {agent.change24h >= 0 ? '+' : ''}{agent.change24h}%
              </span>
            </div>
            <div className={styles.tokenStatRow}>
              <span className={styles.tokenStatLabel}>7d Change</span>
              <span className={`${styles.tokenStatValue} ${agent.change7d >= 0 ? styles.up : styles.down}`}>
                {agent.change7d >= 0 ? '+' : ''}{agent.change7d}%
              </span>
            </div>
            <div className={styles.tokenStatRow}>
              <span className={styles.tokenStatLabel}>24h High</span>
              <span className={styles.tokenStatValue}>${agent.high24h.toFixed(5)}</span>
            </div>
            <div className={styles.tokenStatRow}>
              <span className={styles.tokenStatLabel}>24h Low</span>
              <span className={styles.tokenStatValue}>${agent.low24h.toFixed(5)}</span>
            </div>
            <div className={styles.tokenStatRow}>
              <span className={styles.tokenStatLabel}>Volume 24h</span>
              <span className={styles.tokenStatValue}>{agent.volume24h}</span>
            </div>
            <div className={styles.tokenStatRow}>
              <span className={styles.tokenStatLabel}>Market Cap</span>
              <span className={styles.tokenStatValue}>{agent.mcap}</span>
            </div>
            <div className={styles.tokenStatRow}>
              <span className={styles.tokenStatLabel}>Supply</span>
              <span className={styles.tokenStatValue}>{agent.supply}</span>
            </div>
          </div>
        </aside>

        {/* ── Center: chart ── */}
        <main className={styles.chartArea}>
          {/* Chart header */}
          <div className={styles.chartHeader}>
            <div className={styles.chartHeaderLeft}>
              <span className={styles.chartTokenIcon}>{emoji}</span>
              <div>
                <span className={styles.chartSymbol}>${ticker} / ETH</span>
                <span className={styles.chartPair}>via Base DEX</span>
              </div>
              <span className={`${styles.chartPrice} ${agent.change24h >= 0 ? styles.up : styles.down}`}>
                ${agent.price.toFixed(5)}
              </span>
              <span className={`${styles.chartChange} ${agent.change24h >= 0 ? styles.up : styles.down}`}>
                {agent.change24h >= 0 ? '+' : ''}{agent.change24h}%
              </span>
            </div>
            <div className={styles.chartHeaderRight}>
              <div className={styles.chartBadge}>
                <span className={styles.chartBadgeDot} />
                Base
              </div>
              <div className={styles.chartBadge} style={{ borderColor: `${color}50`, color }}>
                {emoji} Agent Token
              </div>
            </div>
          </div>

          {/* TradingView */}
          <div className={styles.tvWrapper}>
            <TradingViewChart symbol={tvSymbol} />
          </div>

          {/* Recent trades */}
          <div className={styles.recentTrades}>
            <div className={styles.recentTradesHeader}>Recent Trades</div>
            <div className={styles.recentTradesGrid}>
              <span className={styles.recentTradesCol}>Type</span>
              <span className={styles.recentTradesCol}>Amount</span>
              <span className={styles.recentTradesCol}>Price</span>
              <span className={styles.recentTradesCol}>Wallet</span>
              <span className={styles.recentTradesCol}>Time</span>
            </div>
            {RECENT_TRADES.map((t, i) => (
              <div key={i} className={styles.recentTradeRow}>
                <span className={`${styles.tradeType} ${t.type === 'buy' ? styles.up : styles.down}`}>
                  {t.type === 'buy' ? '▲ BUY' : '▼ SELL'}
                </span>
                <span className={styles.tradeAmount}>
                  {(t.amount / 1000).toFixed(0)}K ${ticker}
                </span>
                <span className={styles.tradePrice}>${t.price.toFixed(5)}</span>
                <span className={styles.tradeWallet}>{t.wallet}</span>
                <span className={styles.tradeTime}>{t.time}</span>
              </div>
            ))}
          </div>
        </main>

        {/* ── Right: trade panel ── */}
        <div className={styles.tradePanel}>
          <div className={styles.tradePanelInner} style={{ borderColor: `${color}30` }}>

            {/* Tabs */}
            <div className={styles.tradeTabs}>
              <button
                className={`${styles.tradeTab} ${tab === 'buy' ? styles.tradeTabActive : ''}`}
                style={tab === 'buy' ? { color: '#2ecc71', borderColor: '#2ecc71', background: 'rgba(46,204,113,0.08)' } : {}}
                onClick={() => setTab('buy')}
              >
                Buy
              </button>
              <button
                className={`${styles.tradeTab} ${tab === 'sell' ? styles.tradeTabActive : ''}`}
                style={tab === 'sell' ? { color: '#e74c3c', borderColor: '#e74c3c', background: 'rgba(231,76,60,0.08)' } : {}}
                onClick={() => setTab('sell')}
              >
                Sell
              </button>
            </div>

            {/* Balance */}
            <div className={styles.balanceRow}>
              <span className={styles.balanceLabel}>Balance</span>
              <span className={styles.balanceValue}>
                {tab === 'buy' ? '1.842 ETH' : `245,000 $${ticker}`}
              </span>
            </div>

            {/* Amount input */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                Amount ({tab === 'buy' ? 'ETH' : `$${ticker}`})
              </label>
              <div className={styles.inputWrap}>
                <input
                  type="number"
                  className={styles.tradeInput}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                />
                <button className={styles.maxBtn} onClick={() => setAmount(tab === 'buy' ? '1.842' : '245000')}>
                  MAX
                </button>
              </div>
            </div>

            {/* Quick amounts */}
            <div className={styles.quickAmounts}>
              {tab === 'buy'
                ? ['0.1', '0.25', '0.5', '1.0'].map((v) => (
                    <button key={v} className={styles.quickBtn} onClick={() => setAmount(v)}>{v} ETH</button>
                  ))
                : ['25%', '50%', '75%', '100%'].map((v, i) => (
                    <button key={v} className={styles.quickBtn} onClick={() => setAmount(String(Math.round(245000 * (i + 1) * 0.25)))}>
                      {v}
                    </button>
                  ))
              }
            </div>

            {/* Slippage */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Slippage Tolerance</label>
              <div className={styles.slippageRow}>
                {['0.5', '1.0', '2.0'].map((v) => (
                  <button
                    key={v}
                    className={`${styles.slipBtn} ${slippage === v ? styles.slipBtnActive : ''}`}
                    style={slippage === v ? { borderColor: color, color } : {}}
                    onClick={() => setSlippage(v)}
                  >
                    {v}%
                  </button>
                ))}
                <input
                  className={styles.slipInput}
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  placeholder="Custom"
                />
              </div>
            </div>

            {/* Summary */}
            <div className={styles.tradeSummary}>
              <div className={styles.summaryRow}>
                <span>Price</span>
                <span>${agent.price.toFixed(5)} / ${ticker}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Price Impact</span>
                <span className={styles.up}>{'< 0.1%'}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Network Fee</span>
                <span>~$0.001</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                <span>{tab === 'buy' ? 'You Receive' : 'You Get'}</span>
                <span style={{ color }}>
                  {tab === 'buy'
                    ? `${amountNum > 0 ? (amountNum / agent.price).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'} $${ticker}`
                    : `${amountNum > 0 ? (amountNum * agent.price).toFixed(4) : '0'} ETH`
                  }
                </span>
              </div>
            </div>

            {/* CTA */}
            <button
              className={styles.tradeSubmitBtn}
              style={tab === 'buy'
                ? { background: 'linear-gradient(135deg, #27ae60, #2ecc71)', boxShadow: '0 4px 20px rgba(46,204,113,0.3)' }
                : { background: 'linear-gradient(135deg, #c0392b, #e74c3c)', boxShadow: '0 4px 20px rgba(231,76,60,0.3)' }
              }
            >
              {tab === 'buy' ? `Buy $${ticker}` : `Sell $${ticker}`}
            </button>

            <p className={styles.tradePowered}>
              Powered by <span>Base</span> · Clawpoly DEX
            </p>
          </div>

          {/* Holders */}
          <div className={styles.holdersCard}>
            <div className={styles.holdersTitle}>Top Holders</div>
            {[
              { wallet: 'DevFund...', pct: 18.2 },
              { wallet: 'Treasury...', pct: 12.5 },
              { wallet: '7xKf...m9Pq', pct: 4.8 },
              { wallet: 'Bq2Z...rT5w', pct: 3.1 },
              { wallet: 'Np8J...cV1k', pct: 2.7 },
            ].map((h) => (
              <div key={h.wallet} className={styles.holderRow}>
                <span className={styles.holderWallet}>{h.wallet}</span>
                <div className={styles.holderBarWrap}>
                  <div className={styles.holderBar} style={{ width: `${(h.pct / 20) * 100}%`, background: color }} />
                </div>
                <span className={styles.holderPct}>{h.pct}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
