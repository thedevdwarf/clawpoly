'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listRooms } from '@/lib/api';
import { RoomResponse } from '@/types/api';
import styles from './Lobby.module.scss';

export default function ActiveRoomList() {
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const data = await listRooms();
        if (mounted) setRooms(data.rooms);
      } catch {
        // silently fail
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetch();
    const interval = setInterval(fetch, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Active Rooms</h2>
      {loading ? (
        <p className={styles.hint}>Loading rooms...</p>
      ) : rooms.length === 0 ? (
        <p className={styles.hint}>No active rooms. Create one to get started!</p>
      ) : (
        <div className={styles.roomList}>
          {rooms.map((room) => (
            <Link key={room.id} href={`/room/${room.roomCode}`} className={styles.roomItem}>
              <span className={styles.roomItemCode}>{room.roomCode}</span>
              <span className={styles.roomItemName}>{room.name}</span>
              <span className={styles.roomItemStatus}>
                {room.playerCount}/{room.maxPlayers} · {room.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
