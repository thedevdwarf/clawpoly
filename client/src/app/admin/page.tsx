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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

const STATUS_LABEL: Record<string, string> = {
  waiting: 'Waiting',
  ready: 'Ready',
  roll_order: 'Roll Order',
  playing: 'Playing',
  paused: 'Paused',
  finished: 'Finished',
};

const TOKEN_EMOJI: Record<string, string> = {
  lobster: '🦞', crab: '🦀', octopus: '🐙', seahorse: '🌊', dolphin: '🐬', shark: '🦈',
};

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
      if (!res.ok) {
        setError('Invalid credentials');
        return;
      }
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
          <input
            className={styles.input}
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.loginBtn} type="submit" disabled={loading || !username || !password}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tab, setTab] = useState<'rooms' | 'agents'>('rooms');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

  const headers = authHeaders(token);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, roomsRes, agentsRes] = await Promise.all([
        fetch(`${API}/admin/stats`, { headers }),
        fetch(`${API}/admin/rooms`, { headers }),
        fetch(`${API}/admin/agents`, { headers }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (roomsRes.ok) setRooms((await roomsRes.json()).rooms);
      if (agentsRes.ok) setAgents((await agentsRes.json()).agents);
    } finally {
      setLoading(false);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Actions ──────────────────────────────────────────────────────────────

  async function launchGame() {
    setActionLoading('launch');
    try {
      // Create room
      const createRes = await fetch(`${API}/admin/rooms`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: `Game ${Date.now().toString(36).toUpperCase()}` }),
      });
      if (!createRes.ok) return;
      const { id } = await createRes.json();

      // Add 4 bots
      await fetch(`${API}/admin/rooms/${id}/add-bots`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ count: 4 }),
      });

      // Start
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
    } finally {
      setActionLoading(null);
    }
  }

  async function startGame(roomId: string) {
    setActionLoading(`start-${roomId}`);
    try {
      await fetch(`${API}/admin/rooms/${roomId}/start`, { method: 'POST', headers });
      await fetchAll();
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteRoom(roomId: string) {
    setActionLoading(`del-${roomId}`);
    try {
      await fetch(`${API}/admin/rooms/${roomId}`, { method: 'DELETE', headers });
      await fetchAll();
    } finally {
      setActionLoading(null);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={styles.dash}>
      {/* Header */}
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

        {/* Quick Action */}
        <div className={styles.quickAction}>
          <button
            className={styles.launchBtn}
            onClick={launchGame}
            disabled={actionLoading === 'launch'}
          >
            {actionLoading === 'launch' ? '⏳ Launching…' : '🚀 Launch New Game (4 bots)'}
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'rooms' ? styles.tabActive : ''}`}
            onClick={() => setTab('rooms')}
          >
            Rooms ({rooms.length})
          </button>
          <button
            className={`${styles.tab} ${tab === 'agents' ? styles.tabActive : ''}`}
            onClick={() => setTab('agents')}
          >
            Agents ({agents.length})
          </button>
        </div>

        {/* Rooms Tab */}
        {tab === 'rooms' && (
          <div className={styles.tableWrap}>
            {rooms.length === 0 ? (
              <p className={styles.empty}>No rooms yet.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Players</th>
                    <th>Turn</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <>
                      <tr
                        key={room.id}
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
                              <button
                                className={styles.btnSecondary}
                                onClick={() => addBots(room.id)}
                                disabled={actionLoading === `bots-${room.id}`}
                              >
                                + Bots
                              </button>
                            )}
                            {room.status === 'waiting' && room.playerCount >= 2 && (
                              <button
                                className={styles.btnPrimary}
                                onClick={() => startGame(room.id)}
                                disabled={actionLoading === `start-${room.id}`}
                              >
                                ▶ Start
                              </button>
                            )}
                            <button
                              className={styles.btnDanger}
                              onClick={() => deleteRoom(room.id)}
                              disabled={actionLoading === `del-${room.id}`}
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRoom === room.id && room.players.length > 0 && (
                        <tr key={`${room.id}-expanded`} className={styles.expandedRow}>
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

        {/* Agents Tab */}
        {tab === 'agents' && (
          <div className={styles.tableWrap}>
            {agents.length === 0 ? (
              <p className={styles.empty}>No agents yet.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>ELO</th>
                    <th>Games</th>
                    <th>Wins</th>
                    <th>Win Rate</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.id} className={styles.row}>
                      <td>{agent.name}</td>
                      <td><span className={styles.elo}>{agent.elo}</span></td>
                      <td>{agent.gamesPlayed}</td>
                      <td>{agent.wins}</td>
                      <td>{(agent.winRate * 100).toFixed(1)}%</td>
                      <td className={styles.dateCell}>
                        {new Date(agent.createdAt).toLocaleDateString()}
                      </td>
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
