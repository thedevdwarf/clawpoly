'use client';

import { useCallback, useRef, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { GameState } from '@/types/game';
import { Player } from '@/types/player';
import { Square } from '@/types/square';
import { setWebSocket, getWebSocket } from './webSocketInstance';

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';
const MAX_RETRY_DELAY = 30000;

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
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
        // Clear event log when connecting to a new room
        if (s.roomId !== gs.roomId) {
          store.setState({ eventLog: [] });
        }
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
      case 'game:history': {
        const events = msg.data.events as Array<{ type: string; data: Record<string, unknown>; turnNumber?: number; playerId?: string; timestamp?: string }>;
        // Clear existing log and load all historical events
        store.setState({ eventLog: [] });
        for (const ev of events) {
          s.addEvent({
            id: crypto.randomUUID(),
            sequence: 0,
            turnNumber: ev.turnNumber ?? 0,
            type: ev.type,
            playerId: ev.playerId ?? null,
            data: ev.data,
            timestamp: ev.timestamp || new Date().toISOString(),
          });
        }
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
      case 'game:paused':
        s.setRoomStatus('paused');
        break;
      case 'game:resumed':
        s.setRoomStatus('playing');
        break;
      case 'game:speed_changed':
        if (msg.data.speed) s.setGameSpeed(msg.data.speed as string);
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
      case 'error':
        console.error('[useWebSocket] Server error:', msg.data);
        break;
    }
  }, [store]);

  const connect = useCallback((roomCode: string) => {
    roomCodeRef.current = roomCode;
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    const ws = getWebSocket();
    // Kill old socket cleanly — remove handlers first to prevent ghost reconnects
    if (ws.current) {
      ws.current.onopen = null;
      ws.current.onclose = null;
      ws.current.onerror = null;
      ws.current.onmessage = null;
      ws.current.close();
    }

    const newWs = new WebSocket(`${WS_BASE}/ws/spectator?roomCode=${roomCode}`);
    setWebSocket(newWs);
    ws.current = newWs;

    newWs.onopen = () => {
      setConnected(true);
      store.getState().setConnected(true);
      retryRef.current = 0;
    };

    newWs.onmessage = handleMessage;

    newWs.onclose = () => {
      // Only handle if this is still the active socket
      if (getWebSocket().current !== newWs) return;

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

    newWs.onerror = () => {
      newWs.close();
    };
  }, [handleMessage, store]);

  const pause = useCallback(() => {
    const ws = getWebSocket();
    console.log('[useWebSocket] pause called, ws:', ws.current, 'readyState:', ws.current?.readyState);
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const msg = JSON.stringify({ type: 'spectator:pause', data: {} });
      console.log('[useWebSocket] sending pause message:', msg);
      ws.current.send(msg);
    } else {
      console.error('[useWebSocket] Cannot pause - WebSocket not ready');
    }
  }, []);

  const resume = useCallback(() => {
    const ws = getWebSocket();
    console.log('[useWebSocket] resume called, ws:', ws.current, 'readyState:', ws.current?.readyState);
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const msg = JSON.stringify({ type: 'spectator:resume', data: {} });
      console.log('[useWebSocket] sending resume message:', msg);
      ws.current.send(msg);
    } else {
      console.error('[useWebSocket] Cannot resume - WebSocket not ready');
    }
  }, []);

  const setSpeed = useCallback((speed: string) => {
    const ws = getWebSocket();
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'spectator:set_speed', data: { speed } }));
    }
  }, []);

  const disconnect = useCallback(() => {
    roomCodeRef.current = null;
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    const ws = getWebSocket();
    if (ws.current) {
      ws.current.onopen = null;
      ws.current.onclose = null;
      ws.current.onerror = null;
      ws.current.onmessage = null;
      ws.current.close();
      ws.current = null;
      setWebSocket(null);
    }
    setConnected(false);
    store.getState().setConnected(false);
  }, [store]);

  return { connected, connect, disconnect, pause, resume, setSpeed };
}
