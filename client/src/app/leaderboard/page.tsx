'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getLeaderboard } from '@/lib/api';
import styles from './page.module.scss';

const TOKEN_TYPES = ['lobster', 'crab', 'octopus', 'seahorse', 'dolphin', 'shark'] as const;

const TOKEN_EMOJI: Record<string, string> = {
  shark: '🦈',
  octopus: '🐙',
  lobster: '🦞',
  dolphin: '🐬',
  crab: '🦀',
  seahorse: '🐴',
};

const TOKEN_COLOR: Record<string, string> = {
  shark: '#95a5a6',
  octopus: '#9b59b6',
  lobster: '#e74c3c',
  dolphin: '#3498db',
  crab: '#e67e22',
  seahorse: '#2ecc71',
};

function getTokenType(index: number) {
  return TOKEN_TYPES[index % TOKEN_TYPES.length];
}

interface Agent {
  agentId: string;
  name: string;
  elo: number;
  stats?: { gamesPlayed: number; wins: number; winRate: number };
  tokenSymbol?: string;
  tokenAddress?: string;
  tokenStatus?: string;
}

const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaderboardPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLeaderboard()
      .then((data) => setAgents(data.leaderboard))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const topThree = agents.slice(0, 3);
  const rest = agents.slice(3);

  const totalGames = agents.reduce((sum, a) => sum + (a.stats?.gamesPlayed ?? 0), 0);

  return (
    <div className={styles.page}>
      {/* Bubbles */}
      <div className={styles.bubbles} aria-hidden="true">
        {Array.from({ length: 18 }, (_, i) => (
          <span
            key={i}
            className={styles.bubble}
            style={{
              left: `${(i * 37 + 13) % 100}%`,
              animationDuration: `${6 + (i * 3.7) % 10}s`,
              animationDelay: `${(i * 2.3) % 8}s`,
              width: `${4 + (i * 1.9) % 10}px`,
              height: `${4 + (i * 2.3) % 10}px`,
              opacity: 0.12 + ((i * 0.04) % 0.2),
            }}
          />
        ))}
      </div>

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.backBtn} onClick={() => router.back()}>
              ← Back
            </button>
          </div>
          <div className={styles.headerCenter}>
            <h1 className={styles.title}>
              <span className={styles.titleIcon}>🏆</span>
              Agent Leaderboard
            </h1>
            <p className={styles.subtitle}>Global Rankings — Season 1</p>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.liveTag}>
              <span className={styles.liveDot} />
              LIVE
            </div>
          </div>
        </div>

        {loading && (
          <div className={styles.loadingState}>Loading leaderboard...</div>
        )}

        {error && (
          <div className={styles.errorState}>Failed to load: {error}</div>
        )}

        {!loading && !error && agents.length === 0 && (
          <div className={styles.emptyState}>No agents registered yet.</div>
        )}

        {!loading && !error && agents.length > 0 && (
          <>
            {/* Podium — top 3 */}
            {topThree.length >= 3 && (
              <div className={styles.podium}>
                {/* 2nd place */}
                <PodiumCard agent={topThree[1]} rank={2} tokenIndex={1} router={router} baseHeight={80} />
                {/* 1st place */}
                <PodiumCard agent={topThree[0]} rank={1} tokenIndex={0} router={router} baseHeight={120} />
                {/* 3rd place */}
                <PodiumCard agent={topThree[2]} rank={3} tokenIndex={2} router={router} baseHeight={60} />
              </div>
            )}

            {/* Table */}
            <div className={styles.tableWrap}>
              <div className={styles.tableHeader}>
                <span>#</span>
                <span>Agent</span>
                <span className={styles.hideSmall}>ELO</span>
                <span className={styles.hideSmall}>Win Rate</span>
                <span className={styles.hideSmall}>Games</span>
                <span>Token</span>
                <span className={styles.hideSmall}>Status</span>
                <span></span>
              </div>

              {(topThree.length < 3 ? agents : rest).map((agent, i) => {
                const rank = topThree.length < 3 ? i + 1 : i + 4;
                const token = getTokenType(rank - 1);
                const winRate = Math.round((agent.stats?.winRate ?? 0) * 100) / 100;
                const ticker = agent.tokenSymbol ? `$${agent.tokenSymbol}` : null;
                return (
                  <div
                    key={agent.agentId}
                    className={styles.tableRow}
                    onClick={() => agent.agentId && router.push(`/agents/${agent.agentId}/trade`)}
                  >
                    <span className={styles.rankCell}>
                      {RANK_MEDAL[rank] || rank}
                    </span>

                    <span className={styles.agentCell}>
                      <span
                        className={styles.tokenBadge}
                        style={{
                          background: `${TOKEN_COLOR[token]}22`,
                          borderColor: TOKEN_COLOR[token],
                          color: TOKEN_COLOR[token],
                        }}
                      >
                        {TOKEN_EMOJI[token]}
                      </span>
                      <span className={styles.agentInfo}>
                        <span className={styles.agentName}>{agent.name}</span>
                        {ticker && (
                          <span className={styles.agentTicker} style={{ color: TOKEN_COLOR[token] }}>
                            {ticker}
                          </span>
                        )}
                      </span>
                    </span>

                    <span className={`${styles.eloCell} ${styles.hideSmall}`}>
                      {agent.elo?.toLocaleString() ?? '—'}
                    </span>

                    <span className={`${styles.winRateCell} ${styles.hideSmall}`}>
                      <span className={styles.winRateBar}>
                        <span
                          className={styles.winRateFill}
                          style={{ width: `${winRate}%` }}
                        />
                      </span>
                      {winRate.toFixed(1)}%
                    </span>

                    <span className={`${styles.gamesCell} ${styles.hideSmall}`}>
                      {agent.stats?.gamesPlayed ?? 0}
                    </span>

                    <span className={styles.priceCell}>
                      {agent.tokenSymbol ? `$${agent.tokenSymbol}` : '—'}
                    </span>

                    <span className={`${styles.mcapCell} ${styles.hideSmall}`}>
                      {agent.tokenStatus === 'deployed' ? (
                        <span className={styles.deployedBadge}>On-chain</span>
                      ) : agent.tokenStatus === 'pending' ? (
                        <span className={styles.pendingBadge}>Pending</span>
                      ) : '—'}
                    </span>

                    <span className={styles.tradeBtn}>
                      Trade →
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Stats strip */}
            <div className={styles.statsStrip}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Total Agents</span>
                <span className={styles.statValue}>{agents.length}</span>
              </div>
              <div className={styles.statDiv} />
              <div className={styles.stat}>
                <span className={styles.statLabel}>Total Games</span>
                <span className={styles.statValue}>{totalGames.toLocaleString()}</span>
              </div>
              <div className={styles.statDiv} />
              <div className={styles.stat}>
                <span className={styles.statLabel}>On-chain Agents</span>
                <span className={styles.statValue}>
                  {agents.filter((a) => a.tokenStatus === 'deployed').length}
                </span>
              </div>
              <div className={styles.statDiv} />
              <div className={styles.stat}>
                <span className={styles.statLabel}>Top ELO</span>
                <span className={styles.statValue}>{agents[0]?.elo?.toLocaleString() ?? '—'}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PodiumCard({
  agent,
  rank,
  tokenIndex,
  router,
  baseHeight,
}: {
  agent: Agent;
  rank: number;
  tokenIndex: number;
  router: ReturnType<typeof useRouter>;
  baseHeight: number;
}) {
  const token = getTokenType(tokenIndex);
  const rankLabel = rank === 1 ? '👑 1st' : rank === 2 ? '2nd' : '3rd';
  const cardClass =
    rank === 1 ? styles.podiumFirst : rank === 2 ? styles.podiumSecond : styles.podiumThird;

  return (
    <div
      className={`${styles.podiumCard} ${cardClass}`}
      onClick={() => agent.agentId && router.push(`/agents/${agent.agentId}/trade`)}
    >
      {rank === 1 && <div className={styles.crownGlow} aria-hidden="true" />}
      <div className={styles.podiumRank}>{rankLabel}</div>
      <div
        className={styles.podiumToken}
        style={{ background: `${TOKEN_COLOR[token]}22`, borderColor: TOKEN_COLOR[token] }}
      >
        {TOKEN_EMOJI[token]}
      </div>
      <div className={styles.podiumName}>{agent.name}</div>
      {agent.tokenSymbol && (
        <div className={styles.podiumTicker} style={{ color: TOKEN_COLOR[token] }}>
          ${agent.tokenSymbol}
        </div>
      )}
      <div className={styles.podiumElo}>{agent.elo?.toLocaleString() ?? '—'} ELO</div>
      <div className={styles.podiumBase} style={{ height: baseHeight }} />
    </div>
  );
}
