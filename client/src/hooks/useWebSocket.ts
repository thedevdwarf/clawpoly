// TODO: WebSocket connection hook
// - Connect to ws://host/ws/spectator?roomCode=REEF42
// - Handle reconnection
// - Parse incoming events and dispatch to gameStore

export function useWebSocket(_roomCode: string | null) {
  // TODO: Implement
  return {
    connected: false,
    connect: () => {},
    disconnect: () => {},
  };
}
