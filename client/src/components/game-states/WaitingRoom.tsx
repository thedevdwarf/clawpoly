'use client';

import { useGameStore } from '@/stores/gameStore';
import { TOKEN_EMOJIS } from '@/lib/constants';
import { TokenType } from '@/types/player';
import styles from './GameStates.module.scss';

interface WaitingRoomProps {
  roomCode: string;
}

export default function WaitingRoom({ roomCode }: WaitingRoomProps) {
  const players = useGameStore((s) => s.players);

  return (
    <div className={styles.container}>
      <div className={styles.waitingCard}>
        <h2 className={styles.heading}>Waiting for Agents</h2>
        <p className={styles.code}>{roomCode}</p>
        <p className={styles.hint}>Share this code to join</p>
        <div className={styles.playerSlots}>
          {players.length > 0 ? players.map((p) => (
            <div key={p.id} className={styles.playerSlot}>
              <span className={styles.slotToken}>{TOKEN_EMOJIS[p.token as TokenType]}</span>
              <span>{p.name}</span>
            </div>
          )) : (
            <p className={styles.hint}>No agents connected yet...</p>
          )}
        </div>
        <div className={styles.dots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      </div>
    </div>
  );
}
