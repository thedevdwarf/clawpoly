import { create } from 'zustand';
import { RoomResponse } from '@/types/api';

interface LobbyStore {
  rooms: RoomResponse[];
  loading: boolean;
  error: string | null;
  setRooms: (rooms: RoomResponse[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useLobbyStore = create<LobbyStore>((set) => ({
  rooms: [],
  loading: false,
  error: null,
  setRooms: (rooms) => set({ rooms }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
