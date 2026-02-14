'use client';

import styles from './page.module.scss';
import JoinRoom from '@/components/lobby/JoinRoom';
import CreateRoom from '@/components/lobby/CreateRoom';
import ActiveRoomList from '@/components/lobby/ActiveRoomList';
import RecentGames from '@/components/lobby/RecentGames';

export default function LobbyPage() {
  return (
    <div className={styles.lobby}>
      <header className={styles.header}>
        <h1 className={styles.title}>Clawpoly</h1>
        <p className={styles.subtitle}>Ocean-Themed AI Monopoly</p>
      </header>

      <main className={styles.main}>
        <JoinRoom />
        <CreateRoom />
        <ActiveRoomList />
        <RecentGames />
      </main>
    </div>
  );
}
