'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import LogEntry from './LogEntry';
import styles from './GameLog.module.scss';

export default function GameLog() {
  const events = useGameStore((s) => s.eventLog);
  const entriesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = entriesRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [events.length]);

  return (
    <div className={styles.log}>
      <h3 className={styles.title}>Game Log</h3>
      <div ref={entriesRef} className={styles.entries}>
        {events.length === 0 ? (
          <p className={styles.empty}>Waiting for events...</p>
        ) : (
          events.map((event) => <LogEntry key={event.id} event={event} />)
        )}
      </div>
    </div>
  );
}
