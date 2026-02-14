'use client';

import SpeedSelector from './SpeedSelector';
import styles from './ControlBar.module.scss';

interface ControlBarProps {
  onLeave: () => void;
}

export default function ControlBar({ onLeave }: ControlBarProps) {
  return (
    <div className={styles.bar}>
      <SpeedSelector />
      <div className={styles.right}>
        <button className={styles.leaveBtn} onClick={onLeave}>🚪 Leave</button>
      </div>
    </div>
  );
}
