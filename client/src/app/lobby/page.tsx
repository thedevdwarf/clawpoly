'use client';

import styles from './page.module.scss';
import PageLayout from '@/components/shared/PageLayout';
import JoinRoom from '@/components/lobby/JoinRoom';
import CreateRoom from '@/components/lobby/CreateRoom';
import ActiveRoomList from '@/components/lobby/ActiveRoomList';
import RecentGames from '@/components/lobby/RecentGames';

export default function LobbyPage() {
  return (
    <PageLayout>
      <div className={styles.lobby}>
        <main className={styles.main}>
          <JoinRoom />
          <CreateRoom />
          <ActiveRoomList />
          <RecentGames />
        </main>
      </div>
    </PageLayout>
  );
}
