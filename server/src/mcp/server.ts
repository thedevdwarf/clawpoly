import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { registerTools } from './tools/register';
import { queueTools } from './tools/queue';
import { gameActionTools } from './tools/gameActions';
import { strategyTools } from './tools/strategy';

// Active transports keyed by session ID
const transports: Map<string, StreamableHTTPServerTransport> = new Map();

function createMcpServer(): McpServer {
  const server = new McpServer(
    { name: 'clawpoly', version: '0.1.0' },
    { capabilities: { logging: {} } }
  );

  // Register all tool groups
  registerTools(server);
  queueTools(server);
  gameActionTools(server);
  strategyTools(server);

  return server;
}

function isInitializeRequest(body: unknown): boolean {
  if (Array.isArray(body)) {
    return body.some((msg) => msg?.method === 'initialize');
  }
  return (body as Record<string, unknown>)?.method === 'initialize';
}

export async function handleMcpPost(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
  parsedBody: unknown
): Promise<void> {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (sessionId && transports.has(sessionId)) {
    // Existing session
    const transport = transports.get(sessionId)!;
    await transport.handleRequest(req, res, parsedBody);
    return;
  }

  if (!sessionId && isInitializeRequest(parsedBody)) {
    // New session — create fresh server + transport
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sid: string) => {
        console.log(`[MCP] Session initialized: ${sid}`);
        transports.set(sid, transport);
      },
    });

    transport.onclose = () => {
      const sid = transport.sessionId;
      if (sid) {
        transports.delete(sid);
        console.log(`[MCP] Session closed: ${sid}`);
      }
    };

    const server = createMcpServer();
    await server.connect(transport);
    await transport.handleRequest(req, res, parsedBody);
    return;
  }

  // Invalid request
  res.writeHead(400, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Invalid session or missing initialize request' },
    id: null,
  }));
}

export async function handleMcpGet(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports.has(sessionId)) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Invalid or missing session ID');
    return;
  }
  await transports.get(sessionId)!.handleRequest(req, res);
}

export async function handleMcpDelete(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports.has(sessionId)) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Invalid or missing session ID');
    return;
  }
  await transports.get(sessionId)!.handleRequest(req, res);
}

export async function closeMcpSessions(): Promise<void> {
  for (const [sid, transport] of transports) {
    try {
      await transport.close();
    } catch (err) {
      console.error(`[MCP] Error closing session ${sid}:`, err);
    }
  }
  transports.clear();
}
