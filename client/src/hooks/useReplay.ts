// TODO: Replay engine hook
// - Load events from API
// - Apply events with configurable delay
// - Seek-to-turn capability
// - Playback controls (play, pause, speed)

export function useReplay(_gameId: string) {
  // TODO: Implement
  return {
    playing: false,
    currentTurn: 0,
    totalTurns: 0,
    play: () => {},
    pause: () => {},
    seekToTurn: (_turn: number) => {},
  };
}
