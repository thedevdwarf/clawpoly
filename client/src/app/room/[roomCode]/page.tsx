'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useGameStore } from '@/stores/gameStore';
import GameBoard from '@/components/board/GameBoard';
import AgentPanel from '@/components/agents/AgentPanel';
import GameLog from '@/components/log/GameLog';
import ControlBar from '@/components/controls/ControlBar';
import WaitingRoom from '@/components/game-states/WaitingRoom';
import GameOverOverlay from '@/components/game-states/GameOverOverlay';
import Header from '@/components/shared/Header';
import styles from './GameRoom.module.scss';

export default function GameRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;
  const { connected, connect, disconnect } = useWebSocket();
  const roomStatus = useGameStore((s) => s.roomStatus);
  const roomName = useGameStore((s) => s.roomName);
  const turnNumber = useGameStore((s) => s.turnNumber);

  useEffect(() => {
    connect(roomCode);
    return () => disconnect();
  }, [roomCode, connect, disconnect]);

  const handleLeave = () => {
    disconnect();
    useGameStore.getState().reset();
    router.push('/');
  };

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.gameHeader}>
        <span className={styles.roomInfo}>
          {roomName && <strong>{roomName}</strong>}
          {' '}Room: <code>{roomCode}</code>
          {roomStatus === 'playing' && <> · Turn {turnNumber}</>}
        </span>
        <span className={styles.connectionStatus}>
          {connected ? '🟢 Connected' : '🔴 Reconnecting...'}
        </span>
      </div>

      {roomStatus === 'waiting' || roomStatus === 'ready' ? (
        <WaitingRoom roomCode={roomCode} />
      ) : roomStatus === 'finished' ? (
        <>
          <div className={styles.layout}>
            <div className={styles.sidebar}><AgentPanel /></div>
            <div className={styles.boardArea}><GameBoard /></div>
            <div className={styles.logArea}><GameLog /></div>
          </div>
          <GameOverOverlay onLeave={handleLeave} />
        </>
      ) : (
        <div className={styles.layout}>
          <div className={styles.sidebar}><AgentPanel /></div>
          <div className={styles.boardArea}><GameBoard /></div>
          <div className={styles.logArea}><GameLog /></div>
        </div>
      )}

      <ControlBar onLeave={handleLeave} />
    </div>
  );
}
