'use client';

import { useGameStore } from '@/stores/gameStore';
import AgentCard from './AgentCard';
import styles from './AgentPanel.module.scss';

export default function AgentPanel() {
  const players = useGameStore((s) => s.players);
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);

  if (players.length === 0) {
    return <div className={styles.panel}><p className={styles.empty}>No agents connected</p></div>;
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Agents</h3>
      <div className={styles.list}>
        {players.map((player, i) => (
          <AgentCard key={player.id} player={player} isActive={i === currentPlayerIndex} />
        ))}
      </div>
    </div>
  );
}
