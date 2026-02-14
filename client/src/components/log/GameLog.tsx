'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import LogEntry from './LogEntry';
import styles from './GameLog.module.scss';

export default function GameLog() {
  const events = useGameStore((s) => s.eventLog);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  return (
    <div className={styles.log}>
      <h3 className={styles.title}>Game Log</h3>
      <div className={styles.entries}>
        {events.length === 0 ? (
          <p className={styles.empty}>Waiting for events...</p>
        ) : (
          events.map((event) => <LogEntry key={event.id} event={event} />)
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
