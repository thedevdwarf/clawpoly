'use client';

import { useCallback } from 'react';
import SpeedSelector from './SpeedSelector';
import { useGameStore } from '@/stores/gameStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import styles from './ControlBar.module.scss';

interface ControlBarProps {
  onLeave: () => void;
}

export default function ControlBar({ onLeave }: ControlBarProps) {
  const { pause, resume } = useWebSocket();
  const roomStatus = useGameStore((s) => s.roomStatus);
  const isPaused = roomStatus === 'paused';

  const handlePause = useCallback(() => {
    const shouldPause = !isPaused;
    console.log('[ControlBar] Toggle:', shouldPause ? 'PAUSE' : 'RESUME');

    if (shouldPause) {
      pause();
    } else {
      resume();
    }
  }, [pause, resume, isPaused]);

  return (
    <div className={styles.bar}>
      <SpeedSelector />
      <div className={styles.right}>
        <button className={`${styles.pauseBtn} ${isPaused ? styles.paused : ''}`} onClick={handlePause}>
          {isPaused ? '▶️ Resume' : '⏸ Pause'}
        </button>
        <button className={styles.leaveBtn} onClick={onLeave}>🚪 Leave</button>
      </div>
    </div>
  );
}
