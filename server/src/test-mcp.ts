/**
 * MCP Integration Test
 * Tests the full flow: register 4 agents → join queue → game starts → play via MCP tools
 *
 * Prerequisites: Redis + MongoDB running, server running on port 3000
 * Usage: npx tsx src/test-mcp.ts
 */

const BASE_URL = 'http://localhost:3000/mcp';

interface McpSession {
  sessionId: string | null;
  agentName: string;
  agentToken: string | null;
  agentId: string | null;
  requestId: number;
}

async function mcpRequest(session: McpSession, method: string, params: Record<string, unknown> = {}): Promise<unknown> {
  const id = session.requestId++;
  const body = { jsonrpc: '2.0', method, params, id };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
  };
  if (session.sessionId) {
    headers['mcp-session-id'] = session.sessionId;
  }

  const res = await fetch(BASE_URL, { method: 'POST', headers, body: JSON.stringify(body) });

  // Capture session ID from response
  const newSessionId = res.headers.get('mcp-session-id');
  if (newSessionId) {
    session.sessionId = newSessionId;
  }

  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('text/event-stream')) {
    // SSE response — parse events
    const text = await res.text();
    const lines = text.split('\n');
    const results: unknown[] = [];
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          results.push(JSON.parse(line.slice(6)));
        } catch { /* skip non-JSON */ }
      }
    }
    // Return the response matching our request ID
    const match = results.find((r: unknown) => (r as Record<string, unknown>).id === id);
    return match || results[results.length - 1];
  }

  return res.json();
}

async function initializeSession(name: string): Promise<McpSession> {
  const session: McpSession = { sessionId: null, agentName: name, agentToken: null, agentId: null, requestId: 1 };

  await mcpRequest(session, 'initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: `test-agent-${name}`, version: '1.0.0' },
  });

  // Send initialized notification (required by MCP protocol)
  await mcpRequest(session, 'notifications/initialized', {});

  console.log(`[${name}] Session initialized: ${session.sessionId?.slice(0, 8)}...`);
  return session;
}

async function callTool(session: McpSession, toolName: string, args: Record<string, unknown> = {}): Promise<unknown> {
  const result = await mcpRequest(session, 'tools/call', { name: toolName, arguments: args }) as Record<string, unknown>;
  const content = (result as Record<string, unknown>).result as Record<string, unknown> | undefined;
  if (content?.content) {
    const items = content.content as Array<{ text?: string }>;
    if (items[0]?.text) {
      try {
        return JSON.parse(items[0].text);
      } catch {
        return items[0].text;
      }
    }
  }
  return result;
}

async function listTools(session: McpSession): Promise<void> {
  const result = await mcpRequest(session, 'tools/list', {}) as Record<string, unknown>;
  const tools = ((result as Record<string, unknown>).result as Record<string, unknown>)?.tools as Array<{ name: string }>;
  if (tools) {
    console.log(`[${session.agentName}] Available tools: ${tools.map((t) => t.name).join(', ')}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('=== Clawpoly MCP Integration Test ===\n');

  // Step 1: Initialize 4 sessions
  console.log('--- Step 1: Initialize sessions ---');
  const agents: McpSession[] = [];
  const names = ['DeepReef', 'CoralMind', 'TidalBot', 'AbyssAI'];

  for (const name of names) {
    const session = await initializeSession(name);
    agents.push(session);
  }

  // Step 2: List tools (just first agent)
  console.log('\n--- Step 2: List available tools ---');
  await listTools(agents[0]);

  // Step 3: Register all agents
  console.log('\n--- Step 3: Register agents ---');
  for (const agent of agents) {
    const result = await callTool(agent, 'clawpoly_register', { name: agent.agentName }) as Record<string, string>;
    agent.agentToken = result.agentToken;
    agent.agentId = result.agentId;
    console.log(`[${agent.agentName}] Registered — token: ${agent.agentToken?.slice(0, 8)}... claim: ${result.claimLink}`);
  }

  // Step 4: Join queue (first 3, then 4th triggers game)
  console.log('\n--- Step 4: Join matchmaking queue ---');
  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    const result = await callTool(agent, 'clawpoly_join_queue', { agentToken: agent.agentToken! }) as Record<string, unknown>;
    console.log(`[${agent.agentName}] Queue result: ${result.status} ${result.roomCode ? `(Room: ${result.roomCode})` : `(waiting: ${result.waiting})`}`);
  }

  // Step 5: Wait for game to start, then play
  console.log('\n--- Step 5: Play the game ---');

  // Get game speed from first agent's state to calibrate polling interval
  await sleep(1000); // Let engine initialize
  const initState = await callTool(agents[0], 'clawpoly_get_state', { agentToken: agents[0].agentToken! }) as Record<string, unknown>;

  // Speed delay map (matches server SPEED_DELAYS)
  const speedDelays: Record<string, number> = { very_slow: 2000, slow: 1000, normal: 500, fast: 250, instant: 50 };
  const gameSpeed = (initState.gameSpeed as string) || 'normal';
  // Poll interval = ~3 events worth of delay (dice roll + move + action)
  const pollInterval = Math.max(50, (speedDelays[gameSpeed] || 250) * 3);
  console.log(`  Game speed: ${gameSpeed}, poll interval: ${pollInterval}ms\n`);

  let gameOver = false;
  let pollCount = 0;
  const maxPolls = 500; // Safety limit
  let lastTurnLogged = -1;

  while (!gameOver && pollCount < maxPolls) {
    pollCount++;

    // Poll all agents rapidly looking for pending decisions
    for (const agent of agents) {
      if (!agent.agentToken) continue;

      const state = await callTool(agent, 'clawpoly_get_state', { agentToken: agent.agentToken }) as Record<string, unknown>;

      if (state.status === 'not_in_game') continue;
      if (state.gamePhase === 'finished') {
        const players = state.players as Array<Record<string, unknown>> || [];
        console.log(`\n  Game finished at turn ${state.turnNumber}!`);
        console.log('\n  Final standings:');
        for (const p of players) {
          console.log(`  ${p.name}: $${p.money} | ${p.propertyCount} props | ${p.isBankrupt ? 'BANKRUPT' : 'active'}`);
        }
        gameOver = true;
        break;
      }

      // Log turn changes
      const turnNum = state.turnNumber as number;
      if (turnNum > lastTurnLogged && turnNum % 5 === 0) {
        lastTurnLogged = turnNum;
        const players = state.players as Array<Record<string, unknown>> || [];
        console.log(`\n  --- Turn ${turnNum} ---`);
        for (const p of players) {
          console.log(`  ${p.name}: $${p.money} | ${p.propertyCount} props | ${p.isBankrupt ? 'BANKRUPT' : 'active'}`);
        }
      }

      const pending = state.pendingDecision as Record<string, unknown> | null;
      if (!pending) continue;

      const me = state.me as Record<string, unknown>;
      const decisionType = pending.type as string;

      if (decisionType === 'buy') {
        const price = (pending.property as Record<string, unknown>)?.price as number || 0;
        const money = me?.money as number || 0;
        const shouldBuy = money > price * 1.5;

        if (shouldBuy) {
          await callTool(agent, 'clawpoly_buy_property', { agentToken: agent.agentToken });
          console.log(`  [${agent.agentName}] Bought property for $${price} (has $${money})`);
        } else {
          await callTool(agent, 'clawpoly_pass_property', { agentToken: agent.agentToken });
          console.log(`  [${agent.agentName}] Passed ($${price}, has $${money})`);
        }
      } else if (decisionType === 'build') {
        await callTool(agent, 'clawpoly_skip_build', { agentToken: agent.agentToken });
      } else if (decisionType === 'lobster_pot') {
        const hasCard = (pending as Record<string, unknown>).hasEscapeCard as boolean;
        const money = me?.money as number || 0;

        if (hasCard) {
          await callTool(agent, 'clawpoly_escape_card', { agentToken: agent.agentToken });
          console.log(`  [${agent.agentName}] Used escape card`);
        } else if (money >= 50) {
          await callTool(agent, 'clawpoly_escape_pay', { agentToken: agent.agentToken });
          console.log(`  [${agent.agentName}] Paid 50 to escape`);
        } else {
          await callTool(agent, 'clawpoly_escape_roll', { agentToken: agent.agentToken });
          console.log(`  [${agent.agentName}] Rolling to escape`);
        }
      }
    }

    // Sleep based on game speed
    await sleep(pollInterval);
  }

  if (!gameOver) {
    console.log(`\nTest ended after ${maxPolls} polls. Game may still be running.`);
    const state = await callTool(agents[0], 'clawpoly_get_state', { agentToken: agents[0].agentToken! }) as Record<string, unknown>;
    const players = state.players as Array<Record<string, unknown>> || [];
    console.log(`\n  Turn ${state.turnNumber} | Phase: ${state.gamePhase}`);
    for (const p of players) {
      console.log(`  ${p.name}: $${p.money} | ${p.propertyCount} props | pos ${p.position} | ${p.isBankrupt ? 'BANKRUPT' : 'active'}`);
    }
  }

  console.log('\n=== Test Complete ===');
  process.exit(0);
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
