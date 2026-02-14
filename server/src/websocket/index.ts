import { Server } from 'http';
import { WebSocketServer } from 'ws';
import { URL } from 'url';
import { handleAgentConnection } from './agentHandler';
import { handleSpectatorConnection } from './spectatorHandler';

export function setupWebSocket(server: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    // WebSocket upgrades: origin is not enforced here (ws library handles handshake)
    // In production, add origin validation: if (!allowedOrigins.includes(request.headers.origin)) { socket.destroy(); return; }
    const baseUrl = `http://${request.headers.host || 'localhost'}`;
    const url = new URL(request.url || '/', baseUrl);
    const pathname = url.pathname;

    if (pathname === '/ws/agent') {
      const roomId = url.searchParams.get('roomId');
      const agentToken = url.searchParams.get('agentToken');

      if (!roomId || !agentToken) {
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        handleAgentConnection(ws, roomId, agentToken);
      });
    } else if (pathname === '/ws/spectator') {
      const roomCode = url.searchParams.get('roomCode');

      if (!roomCode) {
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        handleSpectatorConnection(ws, roomCode);
      });
    } else {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
    }
  });

  console.log('[WebSocket] Server initialized with path-based routing');
}
