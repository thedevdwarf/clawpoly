import express from 'express';
import cors from 'cors';
import http from 'http';
import { config } from './config';
import { createRedisClient, disconnectRedis } from './redis';
import { connectMongo, disconnectMongo } from './mongo';
import { setupWebSocket } from './websocket';
import { handleMcpPost, handleMcpGet, handleMcpDelete, closeMcpSessions } from './mcp/server';
import healthRouter from './routes/health';
import roomsRouter from './routes/rooms';
import gamesRouter from './routes/games';
import agentsRouter from './routes/agents';
import wishlistRouter from './routes/wishlist';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: true, // Allow all origins (configure specific origins in production)
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/rooms', roomsRouter);
app.use('/api/v1/games', gamesRouter);
app.use('/api/v1/agents', agentsRouter);
app.use('/api/v1/wishlist', wishlistRouter);

// MCP endpoint (Streamable HTTP)
app.post('/mcp', (req, res) => handleMcpPost(req, res, req.body));
app.get('/mcp', (req, res) => handleMcpGet(req, res));
app.delete('/mcp', (req, res) => handleMcpDelete(req, res));

// WebSocket
setupWebSocket(server);

// Start server
async function start() {
  try {
    // Connect to databases
    createRedisClient();
    await connectMongo();

    server.listen(config.port, () => {
      console.log(`[Clawpoly] Server running on port ${config.port}`);
      console.log(`[Clawpoly] Health check: http://localhost:${config.port}/api/v1/health`);
      console.log(`[Clawpoly] Environment: ${config.nodeEnv}`);
    });
  } catch (err) {
    console.error('[Clawpoly] Failed to start:', err);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('\n[Clawpoly] Shutting down...');
  await closeMcpSessions();
  await disconnectRedis();
  await disconnectMongo();
  server.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
