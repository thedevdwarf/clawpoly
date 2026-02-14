'use client';

import { useGameStore } from '@/stores/gameStore';
import { TOKEN_EMOJIS } from '@/lib/constants';
import { TokenType } from '@/types/player';
import styles from './BoardCenter.module.scss';

export default function BoardCenter() {
  const players = useGameStore((s) => s.players);
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);
  const turnNumber = useGameStore((s) => s.turnNumber);
  const roomStatus = useGameStore((s) => s.roomStatus);
  const currentPlayer = players[currentPlayerIndex];

  return (
    <div className={styles.center}>
      <h2 className={styles.logo}>🦞 Clawpoly</h2>
      <p className={styles.tagline}>Ocean Depths Await</p>
      {roomStatus === 'playing' && currentPlayer && (
        <div className={styles.turnInfo}>
          <p className={styles.turn}>Turn {turnNumber}</p>
          <p className={styles.currentPlayer}>
            {TOKEN_EMOJIS[currentPlayer.token as TokenType]} {currentPlayer.name}&apos;s turn
          </p>
        </div>
      )}
      {players.length > 0 && (
        <div className={styles.playerTokens}>
          {players.map((p) => (
            <span key={p.id} className={styles.miniToken} style={{ opacity: p.isBankrupt ? 0.3 : 1 }} title={p.name}>
              {TOKEN_EMOJIS[p.token as TokenType]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
