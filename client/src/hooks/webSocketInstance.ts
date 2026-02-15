// Shared WebSocket instance to be used by multiple hooks
let globalWsRef: { current: WebSocket | null } = { current: null };

export function setWebSocket(ws: WebSocket | null): void {
  globalWsRef.current = ws;
}

export function getWebSocket(): { current: WebSocket | null } {
  return globalWsRef;
}
