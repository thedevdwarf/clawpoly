'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { TOKEN_EMOJIS, MOCK_AGENT_NAMES } from '@/lib/constants';
import { TokenType } from '@/types/player';
import { joinRoom, startGame } from '@/lib/api';
import styles from './GameStates.module.scss';

interface WaitingRoomProps {
  roomCode: string;
}

export default function WaitingRoom({ roomCode }: WaitingRoomProps) {
  const players = useGameStore((s) => s.players);
  const roomId = useGameStore((s) => s.roomId);
  const roomStatus = useGameStore((s) => s.roomStatus);
  const [addingAgent, setAddingAgent] = useState(false);
  const [startingGame, setStartingGame] = useState(false);

  const handleAddAgent = async () => {
    if (!roomId || addingAgent) return;
    setAddingAgent(true);
    try {
      const randomName = MOCK_AGENT_NAMES[Math.floor(Math.random() * MOCK_AGENT_NAMES.length)];
      await joinRoom(roomId, randomName);
    } catch (err: any) {
      console.error('Failed to add agent:', err.message);
      alert(err.message);
    } finally {
      setAddingAgent(false);
    }
  };

  const handleStartGame = async () => {
    if (!roomId || startingGame) return;
    if (players.length < 2) {
      alert('Need at least 2 players to start the game');
      return;
    }
    setStartingGame(true);
    try {
      await startGame(roomId);
    } catch (err: any) {
      console.error('Failed to start game:', err.message);
      alert(err.message);
    } finally {
      setStartingGame(false);
    }
  };

  const canStart = players.length >= 2 && roomStatus === 'waiting';

  return (
    <div className={styles.container}>
      <div className={styles.waitingCard}>
        <h2 className={styles.heading}>Waiting for Agents</h2>
        <p className={styles.code}>{roomCode}</p>
        <p className={styles.hint}>Share this code to join</p>

        <div className={styles.playerSlots}>
          {players.length > 0 ? players.map((p) => (
            <div key={p.id} className={styles.playerSlot}>
              <span className={styles.slotToken}>{TOKEN_EMOJIS[p.token as TokenType]}</span>
              <span>{p.name}</span>
            </div>
          )) : (
            <p className={styles.hint}>No agents connected yet...</p>
          )}
        </div>

        {roomStatus === 'waiting' && (
          <div className={styles.controls}>
            <button
              className={styles.addButton}
              onClick={handleAddAgent}
              disabled={addingAgent || players.length >= 4}
            >
              {addingAgent ? 'Adding...' : players.length >= 4 ? 'Room Full' : '+ Add Random Agent'}
            </button>
            <button
              className={styles.startButton}
              onClick={handleStartGame}
              disabled={!canStart || startingGame}
            >
              {startingGame ? 'Starting...' : 'Start Game'}
            </button>
          </div>
        )}

        <div className={styles.dots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      </div>
    </div>
  );
}
