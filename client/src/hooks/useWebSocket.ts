'use client';

import { useCallback, useRef, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { GameState } from '@/types/game';
import { Player } from '@/types/player';
import { Square } from '@/types/square';

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';
const MAX_RETRY_DELAY = 30000;

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roomCodeRef = useRef<string | null>(null);

  const store = useGameStore;

  const handleMessage = useCallback((event: MessageEvent) => {
    const msg = JSON.parse(event.data);
    const s = store.getState();

    switch (msg.type) {
      case 'game:state': {
        const gs = msg.data as GameState;
        s.setPlayers(gs.players);
        s.setBoard(gs.board);
        s.setCurrentPlayerIndex(gs.currentPlayerIndex);
        s.setTurnNumber(gs.turnNumber);
        s.setRoomStatus(gs.gamePhase);
        s.setGameSpeed(gs.gameSpeed);
        s.setWinner(gs.winner);
        store.setState({ roomId: gs.roomId, roomName: gs.roomName, roomCode: gs.roomCode });
        break;
      }
      case 'game:dice_rolled':
      case 'game:turn_start':
      case 'game:turn_end':
      case 'game:property_bought':
      case 'game:property_passed':
      case 'game:rent_paid':
      case 'game:tax_paid':
      case 'game:card_drawn':
      case 'game:outpost_built':
      case 'game:fortress_built':
      case 'game:building_sold':
      case 'game:mortgaged':
      case 'game:unmortgaged':
      case 'game:lobster_pot_in':
      case 'game:lobster_pot_out':
      case 'game:set_sail_bonus':
        s.addEvent({ id: crypto.randomUUID(), sequence: 0, turnNumber: msg.data.turnNumber ?? s.turnNumber, type: msg.type, playerId: msg.data.playerId ?? null, data: msg.data, timestamp: msg.timestamp || new Date().toISOString() });
        // Update state fields if provided
        if (msg.data.players) s.setPlayers(msg.data.players as Player[]);
        if (msg.data.board) s.setBoard(msg.data.board as Square[]);
        if (msg.data.currentPlayerIndex !== undefined) s.setCurrentPlayerIndex(msg.data.currentPlayerIndex as number);
        if (msg.data.turnNumber !== undefined) s.setTurnNumber(msg.data.turnNumber as number);
        break;
      case 'game:player_moved':
        s.addEvent({ id: crypto.randomUUID(), sequence: 0, turnNumber: msg.data.turnNumber ?? s.turnNumber, type: msg.type, playerId: msg.data.playerId ?? null, data: msg.data, timestamp: msg.timestamp || new Date().toISOString() });
        if (msg.data.players) s.setPlayers(msg.data.players as Player[]);
        break;
      case 'game:bankrupt':
        s.addEvent({ id: crypto.randomUUID(), sequence: 0, turnNumber: msg.data.turnNumber ?? s.turnNumber, type: msg.type, playerId: msg.data.playerId ?? null, data: msg.data, timestamp: msg.timestamp || new Date().toISOString() });
        if (msg.data.players) s.setPlayers(msg.data.players as Player[]);
        break;
      case 'game:finished':
        s.addEvent({ id: crypto.randomUUID(), sequence: 0, turnNumber: msg.data.turnNumber ?? s.turnNumber, type: msg.type, playerId: null, data: msg.data, timestamp: msg.timestamp || new Date().toISOString() });
        s.setRoomStatus('finished');
        if (msg.data.winner) s.setWinner(msg.data.winner as Player);
        if (msg.data.players) s.setPlayers(msg.data.players as Player[]);
        break;
      case 'game:started':
        s.setRoomStatus('playing');
        if (msg.data.players) s.setPlayers(msg.data.players as Player[]);
        if (msg.data.board) s.setBoard(msg.data.board as Square[]);
        break;
      case 'room:player_joined':
      case 'room:player_disconnected':
      case 'room:player_reconnected':
        if (msg.data.players) s.setPlayers(msg.data.players as Player[]);
        break;
    }
  }, [store]);

  const connect = useCallback((roomCode: string) => {
    roomCodeRef.current = roomCode;
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`${WS_BASE}/ws/spectator?roomCode=${roomCode}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      store.getState().setConnected(true);
      retryRef.current = 0;
    };

    ws.onmessage = handleMessage;

    ws.onclose = () => {
      setConnected(false);
      store.getState().setConnected(false);
      // Auto-reconnect with exponential backoff
      if (roomCodeRef.current) {
        const delay = Math.min(1000 * Math.pow(2, retryRef.current), MAX_RETRY_DELAY);
        retryRef.current++;
        retryTimerRef.current = setTimeout(() => {
          if (roomCodeRef.current) connect(roomCodeRef.current);
        }, delay);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [handleMessage, store]);

  const disconnect = useCallback(() => {
    roomCodeRef.current = null;
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
    store.getState().setConnected(false);
  }, [store]);

  return { connected, connect, disconnect };
}
