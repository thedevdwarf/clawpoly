'use client';

import { useGameStore } from '@/stores/gameStore';
import { GameSpeed } from '@/types/game';
import styles from './SpeedSelector.module.scss';

const SPEEDS: { value: GameSpeed; label: string }[] = [
  { value: 'very_slow', label: 'Very Slow' },
  { value: 'slow', label: 'Slow' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Fast' },
  { value: 'instant', label: 'Instant' },
];

export default function SpeedSelector() {
  const gameSpeed = useGameStore((s) => s.gameSpeed);
  const setGameSpeed = useGameStore((s) => s.setGameSpeed);

  return (
    <div className={styles.selector}>
      <span className={styles.label}>Speed:</span>
      <div className={styles.buttons}>
        {SPEEDS.map((s) => (
          <button
            key={s.value}
            className={`${styles.btn} ${gameSpeed === s.value ? styles.active : ''}`}
            onClick={() => setGameSpeed(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
