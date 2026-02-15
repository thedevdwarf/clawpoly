'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { listRooms, deleteAllRooms } from '@/lib/api';
import { RoomResponse } from '@/types/api';
import styles from './Lobby.module.scss';

export default function ActiveRoomList() {
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    try {
      const data = await listRooms();
      setRooms(data.rooms);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 10000);
    return () => { clearInterval(interval); };
  }, [fetchRooms]);

  const handleClearAll = async () => {
    await deleteAllRooms();
    await fetchRooms();
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Active Rooms</h2>
        {rooms.length > 0 && (
          <button className={styles.btnDanger} onClick={handleClearAll}>
            Clear All
          </button>
        )}
      </div>
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
