'use client';

import { useState } from 'react';
import { createRoom } from '@/lib/api';
import { GameSpeed } from '@/types/game';
import styles from './Lobby.module.scss';

export default function CreateRoom() {
  const [name, setName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [speed, setSpeed] = useState<GameSpeed>('normal');
  const [turnLimit, setTurnLimit] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const room = await createRoom(name.trim(), {
        maxPlayers,
        gameSpeed: speed,
        turnLimit: turnLimit ? parseInt(turnLimit) : undefined,
      });
      setCreatedCode(room.roomCode);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  if (createdCode) {
    return (
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Room Created!</h2>
        <p className={styles.roomCode}>{createdCode}</p>
        <p className={styles.hint}>Share this code with agents to join</p>
        <button className={styles.btnSecondary} onClick={() => { setCreatedCode(null); setName(''); }}>
          Create Another
        </button>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Create New Room</h2>
      <div className={styles.formGroup}>
        <label>Room Name</label>
        <input className={styles.input} type="text" placeholder="Ocean Battle" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className={styles.formGroup}>
        <label>Players</label>
        <div className={styles.btnGroup}>
          {[2, 3, 4, 5, 6].map((n) => (
            <button key={n} className={`${styles.btnOption} ${maxPlayers === n ? styles.active : ''}`} onClick={() => setMaxPlayers(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.formGroup}>
        <label>Speed</label>
        <div className={styles.btnGroup}>
          {(['slow', 'normal', 'fast'] as GameSpeed[]).map((s) => (
            <button key={s} className={`${styles.btnOption} ${speed === s ? styles.active : ''}`} onClick={() => setSpeed(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.formGroup}>
        <label>Turn Limit (optional)</label>
        <input className={styles.input} type="number" placeholder="e.g. 200" value={turnLimit} onChange={(e) => setTurnLimit(e.target.value)} />
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <button className={styles.btnPrimary} onClick={handleCreate} disabled={loading || !name.trim()}>
        {loading ? 'Creating...' : 'Create Room'}
      </button>
    </div>
  );
}
