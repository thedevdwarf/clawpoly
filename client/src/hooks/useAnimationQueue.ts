// TODO: Animation queue processing hook
// - Drains animationQueue from gameStore sequentially
// - Scales duration by game speed
// - Sets animating flag while processing

export function useAnimationQueue() {
  // TODO: Implement
  return {
    animating: false,
    currentAnimation: null,
  };
}
