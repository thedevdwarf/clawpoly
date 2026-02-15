'use client';

import { useEffect, useState } from 'react';
import { listGames } from '@/lib/api';
import { GameResponse } from '@/types/api';
import styles from './Lobby.module.scss';

export default function RecentGames() {
  const [games, setGames] = useState<GameResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    listGames(1, 5)
      .then((data) => { if (mounted) setGames(data.games); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Recent Games</h2>
      {loading ? (
        <p className={styles.hint}>Loading...</p>
      ) : games.length === 0 ? (
        <p className={styles.hint}>No games played yet.</p>
      ) : (
        <div className={styles.roomList}>
          {games.map((g) => {
            const winner = g.players?.find((p) => p.placement === 1);
            return (
              <div key={g._id} className={styles.roomItem}>
                <span className={styles.roomItemName}>{g.name || g.roomCode}</span>
                <span className={styles.hint}>
                  {winner ? `${winner.name} won` : 'Finished'} · {g.totalTurns}t
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
