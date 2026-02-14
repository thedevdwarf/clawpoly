'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Lobby.module.scss';

export default function JoinRoom() {
  const [code, setCode] = useState('');
  const router = useRouter();

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed) router.push(`/room/${trimmed}`);
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Join a Room</h2>
      <div className={styles.joinRow}>
        <input
          className={styles.input}
          type="text"
          placeholder="Enter room code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
        />
        <button className={styles.btnPrimary} onClick={handleJoin} disabled={!code.trim()}>
          Join
        </button>
      </div>
    </div>
  );
}
