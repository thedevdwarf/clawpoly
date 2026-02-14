import { create } from 'zustand';
import { Player } from '@/types/player';
import { Square } from '@/types/square';
import { GamePhase, GameSpeed, GameEvent, Card, Animation } from '@/types/game';

interface GameStore {
  // Connection
  connected: boolean;
  roomCode: string | null;

  // Room
  roomId: string | null;
  roomName: string;
  roomStatus: GamePhase;

  // Game State
  players: Player[];
  board: Square[];
  currentPlayerIndex: number;
  turnNumber: number;
  winner: Player | null;

  // UI State
  gameSpeed: GameSpeed;
  eventLog: GameEvent[];
  selectedSquare: number | null;
  showCardOverlay: boolean;
  currentCard: Card | null;

  // Animation State
  animating: boolean;
  animationQueue: Animation[];

  // Actions
  setConnected: (connected: boolean) => void;
  setRoomCode: (code: string | null) => void;
  setPlayers: (players: Player[]) => void;
  setBoard: (board: Square[]) => void;
  setCurrentPlayerIndex: (index: number) => void;
  setTurnNumber: (turn: number) => void;
  setGameSpeed: (speed: GameSpeed) => void;
  addEvent: (event: GameEvent) => void;
  selectSquare: (index: number | null) => void;
  setWinner: (player: Player | null) => void;
  setRoomStatus: (status: GamePhase) => void;
  queueAnimation: (anim: Animation) => void;
  dequeueAnimation: () => void;
  reset: () => void;
}

const initialState = {
  connected: false,
  roomCode: null,
  roomId: null,
  roomName: '',
  roomStatus: 'waiting' as GamePhase,
  players: [],
  board: [],
  currentPlayerIndex: 0,
  turnNumber: 0,
  winner: null,
  gameSpeed: 'normal' as GameSpeed,
  eventLog: [],
  selectedSquare: null,
  showCardOverlay: false,
  currentCard: null,
  animating: false,
  animationQueue: [],
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setConnected: (connected) => set({ connected }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setPlayers: (players) => set({ players }),
  setBoard: (board) => set({ board }),
  setCurrentPlayerIndex: (currentPlayerIndex) => set({ currentPlayerIndex }),
  setTurnNumber: (turnNumber) => set({ turnNumber }),
  setGameSpeed: (gameSpeed) => set({ gameSpeed }),
  addEvent: (event) => set((state) => ({ eventLog: [...state.eventLog, event] })),
  selectSquare: (selectedSquare) => set({ selectedSquare }),
  setWinner: (winner) => set({ winner }),
  setRoomStatus: (roomStatus) => set({ roomStatus }),
  queueAnimation: (anim) =>
    set((state) => ({ animationQueue: [...state.animationQueue, anim] })),
  dequeueAnimation: () =>
    set((state) => ({ animationQueue: state.animationQueue.slice(1) })),
  reset: () => set(initialState),
}));
