'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.scss';

const API = process.env.NEXT_PUBLIC_LOCAL === 'true'
  ? process.env.NEXT_PUBLIC_LOCAL_API_URL
  : process.env.NEXT_PUBLIC_API_URL;

// ─── Types ───────────────────────────────────────────────────────────────────

interface Stats {
  totalRooms: number;
  activeRooms: number;
  totalAgents: number;
  totalGames: number;
}

interface RoomPlayer {
  name: string;
  token: string;
  money: number;
  isBankrupt: boolean;
}

interface Room {
  id: string;
  roomCode: string;
  name: string;
  status: string;
  playerCount: number;
  maxPlayers: number;
  turnNumber: number;
  createdAt: string;
  players: RoomPlayer[];
}

interface Agent {
  id: string;
  name: string;
  elo: number;
  gamesPlayed: number;
  wins: number;
  winRate: number;
  createdAt: string;
}

interface GamePlayer {
  id: string;
  name: string;
  token: string;
  finalMoney: number;
  placement: number;
  isBankrupt: boolean;
}

interface Game {
  _id: string;
  roomCode: string;
  name: string;
  winnerId: string;
  totalTurns: number;
  duration: number;
  startedAt: string;
  finishedAt: string;
  players: GamePlayer[];
}

interface StressResult {
  requested: number;
  started: number;
  errors: string[];
}

interface GameEvent {
  _id: string;
  sequence: number;
  turnNumber: number;
  type: string;
  playerId: string | null;
  data: Record<string, unknown>;
  timestamp: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

const STATUS_LABEL: Record<string, string> = {
  waiting: 'Waiting', ready: 'Ready', roll_order: 'Roll Order',
  playing: 'Playing', paused: 'Paused', finished: 'Finished',
};

const TOKEN_EMOJI: Record<string, string> = {
  lobster: '🦞', crab: '🦀', octopus: '🐙', seahorse: '🌊', dolphin: '🐬', shark: '🦈',
};

const EVENT_TYPE_LABEL: Record<string, string> = {
  game_started: '🎮 Game started',
  game_finished: '🏆 Game finished',
  turn_start: '▶ Turn start',
  dice_rolled: '🎲 Dice rolled',
  player_moved: '📍 Moved',
  property_bought: '🏠 Property bought',
  property_passed: '⏭ Passed property',
  rent_paid: '💸 Rent paid',
  tax_paid: '🐟 Tax paid',
  card_drawn: '🃏 Card drawn',
  card_executed: '⚡ Card executed',
  outpost_built: '🏗 Outpost built',
  fortress_built: '🏰 Fortress built',
  lobster_pot_in: '🦞 Sent to Lobster Pot',
  lobster_pot_out: '🔓 Escaped Lobster Pot',
  lobster_pot_escape_pay: '💰 Paid to escape',
  bankrupt: '💀 Bankrupt',
  set_sail: '⚓ Passed Set Sail',
  mortgage: '📉 Mortgaged',
  unmortgage: '📈 Unmortgaged',
};

function eventDescription(event: GameEvent): string {
  const d = event.data;
  switch (event.type) {
    case 'dice_rolled':
      return `Rolled ${d.die1} + ${d.die2} = ${d.total}${d.doubles ? ' (doubles!)' : ''}`;
    case 'player_moved':
      return `Moved to position ${d.to} (${d.squareName ?? ''})`;
    case 'property_bought':
      return `Bought ${d.squareName ?? `sq.${d.squareIndex}`} for $${d.price}`;
    case 'rent_paid':
      return `Paid $${d.amount} rent to ${d.toName ?? 'owner'}`;
    case 'tax_paid':
      return `Paid $${d.amount} tax`;
    case 'card_drawn':
      return `"${d.text ?? d.cardType}"`;
    case 'outpost_built':
      return `Built outpost on ${d.squareName ?? `sq.${d.squareIndex}`} (${d.count} total)`;
    case 'fortress_built':
      return `Built fortress on ${d.squareName ?? `sq.${d.squareIndex}`}`;
    case 'set_sail':
      return `Collected $200`;
    case 'bankrupt':
      return `Eliminated at turn ${event.turnNumber}`;
    case 'game_finished':
      return `Winner: ${d.winnerName ?? d.winnerId}`;
    default:
      return Object.keys(d).length ? JSON.stringify(d).slice(0, 80) : '';
  }
}

function fmtDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) { setError('Invalid credentials'); return; }
      const data = await res.json();
      localStorage.setItem('admin_token', data.token);
      onLogin(data.token);
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginWrap}>
      <div className={styles.loginCard}>
        <div className={styles.loginIcon}>🛡️</div>
        <h1 className={styles.loginTitle}>Admin Panel</h1>
        <p className={styles.loginSub}>Clawpoly Control Center</p>
        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <input className={styles.input} type="text" placeholder="Username"
            value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          <input className={styles.input} type="password" placeholder="Password"
            value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.loginBtn} type="submit" disabled={loading || !username || !password}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Game Log Panel ───────────────────────────────────────────────────────────

function GameLogPanel({ game, playerMap }: { game: Game; playerMap: Map<string, GamePlayer> }) {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 100;

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/games/${game._id}/events?from=${p * limit}&limit=${limit}`);
      if (!res.ok) return;
      const data = await res.json();
      setEvents(data.events);
      setTotal(data.total);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, [game._id]);

  useEffect(() => { load(0); }, [load]);

  const pages = Math.ceil(total / limit);

  return (
    <div className={styles.logPanel}>
      <div className={styles.logHeader}>
        <span className={styles.logTitle}>Event Log</span>
        <span className={styles.logMeta}>{total} events · {pages} page{pages !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className={styles.logLoading}>Loading…</div>
      ) : (
        <>
          <div className={styles.logList}>
            {events.map((ev) => {
              const player = ev.playerId ? playerMap.get(ev.playerId) : null;
              const desc = eventDescription(ev);
              return (
                <div key={ev._id} className={`${styles.logEntry} ${styles[`evt_${ev.type}`] ?? ''}`}>
                  <span className={styles.logSeq}>#{ev.sequence}</span>
                  <span className={styles.logTurn}>T{ev.turnNumber}</span>
                  <span className={styles.logType}>
                    {EVENT_TYPE_LABEL[ev.type] ?? ev.type}
                  </span>
                  {player && (
                    <span className={styles.logPlayer}>
                      {TOKEN_EMOJI[player.token] ?? '🐟'} {player.name}
                    </span>
                  )}
                  {desc && <span className={styles.logDesc}>{desc}</span>}
                </div>
              );
            })}
          </div>

          {pages > 1 && (
            <div className={styles.logPagination}>
              <button className={styles.btnSecondary} onClick={() => load(page - 1)} disabled={page === 0}>
                ← Prev
              </button>
              <span className={styles.logPage}>{page + 1} / {pages}</span>
              <button className={styles.btnSecondary} onClick={() => load(page + 1)} disabled={page >= pages - 1}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [gamesTotal, setGamesTotal] = useState(0);
  const [tab, setTab] = useState<'rooms' | 'agents' | 'games'>('rooms');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [expandedGame, setExpandedGame] = useState<string | null>(null);

  // Stress test state
  const [stressCount, setStressCount] = useState(10);
  const [stressSpeed, setStressSpeed] = useState('instant');
  const [stressRunning, setStressRunning] = useState(false);
  const [stressResult, setStressResult] = useState<StressResult | null>(null);
  const [stressBaseGames, setStressBaseGames] = useState(0);
  const [stressPolling, setStressPolling] = useState(false);

  const headers = authHeaders(token);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, roomsRes, agentsRes, gamesRes] = await Promise.all([
        fetch(`${API}/admin/stats`, { headers }),
        fetch(`${API}/admin/rooms`, { headers }),
        fetch(`${API}/admin/agents`, { headers }),
        fetch(`${API}/games?limit=50`),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (roomsRes.ok) setRooms((await roomsRes.json()).rooms);
      if (agentsRes.ok) setAgents((await agentsRes.json()).agents);
      if (gamesRes.ok) {
        const gd = await gamesRes.json();
        setGames(gd.games);
        setGamesTotal(gd.total);
      }
    } finally {
      setLoading(false);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Actions ──────────────────────────────────────────────────────────────

  async function launchGame() {
    setActionLoading('launch');
    try {
      const createRes = await fetch(`${API}/admin/rooms`, {
        method: 'POST', headers,
        body: JSON.stringify({ name: `Game ${Date.now().toString(36).toUpperCase()}` }),
      });
      if (!createRes.ok) return;
      const { id } = await createRes.json();
      await fetch(`${API}/admin/rooms/${id}/add-bots`, {
        method: 'POST', headers, body: JSON.stringify({ count: 4 }),
      });
      await fetch(`${API}/admin/rooms/${id}/start`, { method: 'POST', headers });
      await fetchAll();
    } finally {
      setActionLoading(null);
    }
  }

  async function addBots(roomId: string) {
    setActionLoading(`bots-${roomId}`);
    try {
      await fetch(`${API}/admin/rooms/${roomId}/add-bots`, {
        method: 'POST', headers, body: JSON.stringify({ count: 4 }),
      });
      await fetchAll();
    } finally { setActionLoading(null); }
  }

  async function startGame(roomId: string) {
    setActionLoading(`start-${roomId}`);
    try {
      await fetch(`${API}/admin/rooms/${roomId}/start`, { method: 'POST', headers });
      await fetchAll();
    } finally { setActionLoading(null); }
  }

  async function runStressTest() {
    setStressRunning(true);
    setStressResult(null);

    // Snapshot current game count as baseline
    const baseRes = await fetch(`${API}/admin/stats`, { headers });
    const baseStats = baseRes.ok ? await baseRes.json() : null;
    setStressBaseGames(baseStats?.totalGames ?? 0);

    try {
      const res = await fetch(`${API}/admin/stress-test`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ count: stressCount, speed: stressSpeed }),
      });
      const data = await res.json();
      setStressResult(data);
      setStressPolling(true);
      await fetchAll();
    } finally {
      setStressRunning(false);
    }
  }

  // Poll stats while stress test is running
  useEffect(() => {
    if (!stressPolling) return;
    const interval = setInterval(async () => {
      const res = await fetch(`${API}/admin/stats`, { headers });
      if (res.ok) {
        const s = await res.json();
        setStats(s);
        if (s.activeRooms === 0) {
          setStressPolling(false);
          clearInterval(interval);
          fetchAll();
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [stressPolling]); // eslint-disable-line react-hooks/exhaustive-deps

  async function deleteRoom(roomId: string) {
    setActionLoading(`del-${roomId}`);
    try {
      await fetch(`${API}/admin/rooms/${roomId}`, { method: 'DELETE', headers });
      await fetchAll();
    } finally { setActionLoading(null); }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={styles.dash}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerIcon}>🦈</span>
          <span className={styles.headerTitle}>Clawpoly Admin</span>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.refreshBtn} onClick={fetchAll} disabled={loading}>
            {loading ? '…' : '↺ Refresh'}
          </button>
          <button className={styles.logoutBtn} onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div className={styles.content}>
        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats?.totalRooms ?? '–'}</div>
            <div className={styles.statLabel}>Total Rooms</div>
          </div>
          <div className={`${styles.statCard} ${styles.statGreen}`}>
            <div className={styles.statValue}>{stats?.activeRooms ?? '–'}</div>
            <div className={styles.statLabel}>Active Games</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats?.totalAgents ?? '–'}</div>
            <div className={styles.statLabel}>Agents</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats?.totalGames ?? '–'}</div>
            <div className={styles.statLabel}>Games Played</div>
          </div>
        </div>

        {/* Actions Row */}
        <div className={styles.actionsRow}>
          {/* Single Game */}
          <button className={styles.launchBtn} onClick={launchGame} disabled={actionLoading === 'launch'}>
            {actionLoading === 'launch' ? '⏳ Launching…' : '🚀 Launch New Game (4 bots)'}
          </button>

          {/* Stress Test */}
          <div className={styles.stressBox}>
            <div className={styles.stressControls}>
              <div className={styles.stressField}>
                <label className={styles.stressLabel}>Games</label>
                <input
                  type="number"
                  className={styles.stressInput}
                  min={1} max={200}
                  value={stressCount}
                  onChange={(e) => setStressCount(Math.min(200, Math.max(1, parseInt(e.target.value) || 1)))}
                  disabled={stressRunning}
                />
              </div>
              <div className={styles.stressField}>
                <label className={styles.stressLabel}>Speed</label>
                <select
                  className={styles.stressSelect}
                  value={stressSpeed}
                  onChange={(e) => setStressSpeed(e.target.value)}
                  disabled={stressRunning}
                >
                  <option value="instant">Instant</option>
                  <option value="fast">Fast</option>
                  <option value="normal">Normal</option>
                  <option value="slow">Slow</option>
                </select>
              </div>
              <button
                className={styles.stressBtn}
                onClick={runStressTest}
                disabled={stressRunning}
              >
                {stressRunning ? '⏳ Launching…' : '⚡ Stress Test'}
              </button>
            </div>

            {/* Result / Progress */}
            {stressResult && (
              <div className={styles.stressResult}>
                <span className={styles.stressStarted}>✓ {stressResult.started} games started</span>
                {stressPolling && (
                  <span className={styles.stressActive}>
                    · {stats?.activeRooms ?? '?'} active
                    · {Math.max(0, (stats?.totalGames ?? 0) - stressBaseGames)} finished
                  </span>
                )}
                {!stressPolling && stressResult.started > 0 && (
                  <span className={styles.stressDone}>· All done ✓</span>
                )}
                {stressResult.errors.length > 0 && (
                  <span className={styles.stressErrors}>· {stressResult.errors.length} error(s)</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'rooms' ? styles.tabActive : ''}`} onClick={() => setTab('rooms')}>
            Rooms ({rooms.length})
          </button>
          <button className={`${styles.tab} ${tab === 'games' ? styles.tabActive : ''}`} onClick={() => setTab('games')}>
            Games ({gamesTotal})
          </button>
          <button className={`${styles.tab} ${tab === 'agents' ? styles.tabActive : ''}`} onClick={() => setTab('agents')}>
            Agents ({agents.length})
          </button>
        </div>

        {/* Rooms Tab */}
        {tab === 'rooms' && (
          <div className={styles.tableWrap}>
            {rooms.length === 0 ? <p className={styles.empty}>No rooms yet.</p> : (
              <table className={styles.table}>
                <thead>
                  <tr><th>Code</th><th>Name</th><th>Status</th><th>Players</th><th>Turn</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <>
                      <tr key={room.id}
                        className={`${styles.row} ${expandedRoom === room.id ? styles.rowExpanded : ''}`}
                        onClick={() => setExpandedRoom(expandedRoom === room.id ? null : room.id)}
                      >
                        <td><code className={styles.code}>{room.roomCode}</code></td>
                        <td>{room.name}</td>
                        <td>
                          <span className={`${styles.badge} ${styles[`badge_${room.status}`]}`}>
                            {STATUS_LABEL[room.status] ?? room.status}
                          </span>
                        </td>
                        <td>{room.playerCount} / {room.maxPlayers}</td>
                        <td>{room.status === 'playing' ? `#${room.turnNumber}` : '–'}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className={styles.actions}>
                            {room.status === 'waiting' && room.playerCount < room.maxPlayers && (
                              <button className={styles.btnSecondary} onClick={() => addBots(room.id)}
                                disabled={actionLoading === `bots-${room.id}`}>+ Bots</button>
                            )}
                            {room.status === 'waiting' && room.playerCount >= 2 && (
                              <button className={styles.btnPrimary} onClick={() => startGame(room.id)}
                                disabled={actionLoading === `start-${room.id}`}>▶ Start</button>
                            )}
                            <button className={styles.btnDanger} onClick={() => deleteRoom(room.id)}
                              disabled={actionLoading === `del-${room.id}`}>✕</button>
                          </div>
                        </td>
                      </tr>
                      {expandedRoom === room.id && room.players.length > 0 && (
                        <tr key={`${room.id}-exp`} className={styles.expandedRow}>
                          <td colSpan={6}>
                            <div className={styles.playerList}>
                              {room.players.map((p, i) => (
                                <div key={i} className={`${styles.playerChip} ${p.isBankrupt ? styles.bankrupt : ''}`}>
                                  <span>{TOKEN_EMOJI[p.token] ?? '🐟'}</span>
                                  <span>{p.name}</span>
                                  <span className={styles.money}>${p.money.toLocaleString()}</span>
                                  {p.isBankrupt && <span className={styles.bankruptLabel}>BANKRUPT</span>}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Games Tab */}
        {tab === 'games' && (
          <div className={styles.tableWrap}>
            {games.length === 0 ? <p className={styles.empty}>No games yet.</p> : (
              <table className={styles.table}>
                <thead>
                  <tr><th>Code</th><th>Winner</th><th>Players</th><th>Turns</th><th>Duration</th><th>Finished</th></tr>
                </thead>
                <tbody>
                  {games.map((game) => {
                    const winner = game.players.find((p) => p.id === game.winnerId);
                    const playerMap = new Map(game.players.map((p) => [p.id, p]));
                    const isExpanded = expandedGame === game._id;
                    return (
                      <>
                        <tr key={game._id}
                          className={`${styles.row} ${isExpanded ? styles.rowExpanded : ''}`}
                          onClick={() => setExpandedGame(isExpanded ? null : game._id)}
                        >
                          <td><code className={styles.code}>{game.roomCode}</code></td>
                          <td>
                            {winner ? (
                              <span className={styles.winner}>
                                {TOKEN_EMOJI[winner.token] ?? '🏆'} {winner.name}
                              </span>
                            ) : '–'}
                          </td>
                          <td>
                            <div className={styles.playerTokens}>
                              {game.players
                                .sort((a, b) => a.placement - b.placement)
                                .map((p) => (
                                  <span key={p.id} className={`${styles.tokenBadge} ${p.isBankrupt ? styles.tokenBankrupt : ''}`}
                                    title={`${p.name} — $${p.finalMoney}`}>
                                    {TOKEN_EMOJI[p.token] ?? '🐟'}
                                  </span>
                                ))}
                            </div>
                          </td>
                          <td>{game.totalTurns}</td>
                          <td>{fmtDuration(game.duration)}</td>
                          <td className={styles.dateCell}>
                            {new Date(game.finishedAt).toLocaleString()}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${game._id}-exp`} className={styles.expandedRow}>
                            <td colSpan={6}>
                              {/* Standings */}
                              <div className={styles.standings}>
                                {game.players
                                  .sort((a, b) => a.placement - b.placement)
                                  .map((p) => (
                                    <div key={p.id} className={`${styles.standingRow} ${p.placement === 1 ? styles.standingFirst : ''}`}>
                                      <span className={styles.placement}>#{p.placement}</span>
                                      <span>{TOKEN_EMOJI[p.token] ?? '🐟'}</span>
                                      <span className={styles.standingName}>{p.name}</span>
                                      <span className={styles.money}>${p.finalMoney.toLocaleString()}</span>
                                      {p.isBankrupt && <span className={styles.bankruptLabel}>BANKRUPT</span>}
                                    </div>
                                  ))}
                              </div>
                              {/* Event Log */}
                              <GameLogPanel game={game} playerMap={playerMap} />
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Agents Tab */}
        {tab === 'agents' && (
          <div className={styles.tableWrap}>
            {agents.length === 0 ? <p className={styles.empty}>No agents yet.</p> : (
              <table className={styles.table}>
                <thead>
                  <tr><th>Name</th><th>ELO</th><th>Games</th><th>Wins</th><th>Win Rate</th><th>Joined</th></tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.id} className={styles.row}>
                      <td>{agent.name}</td>
                      <td><span className={styles.elo}>{agent.elo}</span></td>
                      <td>{agent.gamesPlayed}</td>
                      <td>{agent.wins}</td>
                      <td>{(agent.winRate * 100).toFixed(1)}%</td>
                      <td className={styles.dateCell}>{new Date(agent.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('admin_token');
    if (stored) setToken(stored);
    setChecked(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
  };

  if (!checked) return null;

  return token
    ? <Dashboard token={token} onLogout={handleLogout} />
    : <LoginScreen onLogin={setToken} />;
}
