'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { TOKEN_EMOJIS } from '@/lib/constants';
import { TokenType } from '@/types/player';
import { formatShells } from '@/lib/utils';
import styles from './GameStates.module.scss';

interface GameOverOverlayProps {
  onLeave: () => void;
}

export default function GameOverOverlay({ onLeave }: GameOverOverlayProps) {
  const winner = useGameStore((s) => s.winner);
  const players = useGameStore((s) => s.players);
  const [hidden, setHidden] = useState(false);

  if (!winner || hidden) return null;

  const sorted = [...players].sort((a, b) => {
    if (a.isBankrupt !== b.isBankrupt) return a.isBankrupt ? 1 : -1;
    return b.money - a.money;
  });

  return (
    <div className={styles.overlay}>
      <div className={styles.overlayCard}>
        <div className={styles.headerRow}>
          <h2 className={styles.heading}>🏆 Game Over!</h2>
          <button className={styles.closeBtn} onClick={() => setHidden(true)}>✕</button>
        </div>
        <div className={styles.winnerSection}>
          <span className={styles.winnerToken}>{TOKEN_EMOJIS[winner.token as TokenType]}</span>
          <span className={styles.winnerName}>{winner.name}</span>
          <span className={styles.winnerBalance}>{formatShells(winner.money)}</span>
        </div>
        <div className={styles.standings}>
          {sorted.map((p, i) => (
            <div key={p.id} className={styles.standingRow}>
              <span className={styles.rank}>#{i + 1}</span>
              <span>{TOKEN_EMOJIS[p.token as TokenType]} {p.name}</span>
              <span className={styles.standingMoney}>{formatShells(p.money)}</span>
              {p.isBankrupt && <span className={styles.bankruptTag}>BANKRUPT</span>}
            </div>
          ))}
        </div>
        <button className={styles.lobbyBtn} onClick={onLeave}>Back to Lobby</button>
      </div>
    </div>
  );
}
