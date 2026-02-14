import { createInitialGameState } from './state/gameState';
import { GameEngine } from './engine/gameEngine';
import { RandomAgent } from './engine/agents/randomAgent';
import { determineTurnOrder } from './engine/turnOrder';
import { Player, TOKEN_COLORS, TokenType } from './types/player';
import { AgentDecision } from './types/agent';

// Create 4 players
const tokens: TokenType[] = ['lobster', 'crab', 'octopus', 'seahorse'];
const players: Player[] = tokens.map((token, i) => ({
  id: `player-${i + 1}`,
  name: `Agent ${token.charAt(0).toUpperCase() + token.slice(1)}`,
  token,
  color: TOKEN_COLORS[token],
  money: 1500,
  position: 0,
  properties: [],
  inLobsterPot: false,
  lobsterPotTurns: 0,
  escapeCards: 0,
  isBankrupt: false,
  connected: true,
  consecutiveTimeouts: 0,
}));

// Create game state
const state = createInitialGameState('test-room', 'TEST01', 'Test Game', {
  turnLimit: 200,
  gameSpeed: 'instant',
});
state.players = players;

// Determine turn order
const orderResult = determineTurnOrder(players.map((p) => p.id));
console.log('Turn order:', orderResult.order.map((id) => {
  const p = players.find((pl) => pl.id === id)!;
  return `${p.name} (rolled ${orderResult.rolls[id]})`;
}));

// Reorder players
state.players = orderResult.order.map((id) => players.find((p) => p.id === id)!);

// Create agents
const agents = new Map<string, AgentDecision>();
for (const player of state.players) {
  agents.set(player.id, new RandomAgent());
}

// Create engine with event logging
const engine = new GameEngine(state, agents);

let eventCount = 0;
engine.onEvent((event) => {
  eventCount++;
  const prefix = `[Turn ${event.turnNumber}]`;

  switch (event.type) {
    case 'game:turn_start':
      console.log(`\n${prefix} === ${event.data.playerName}'s turn ===`);
      break;
    case 'game:dice_rolled':
      console.log(`${prefix}   Rolled ${(event.data.dice as number[]).join('+')}=${event.data.total}${event.data.doubles ? ' (DOUBLES!)' : ''}`);
      break;
    case 'game:player_moved':
      console.log(`${prefix}   Moved to ${event.data.squareName} (${event.data.from}->${event.data.to})`);
      break;
    case 'game:property_bought':
      console.log(`${prefix}   BOUGHT ${event.data.squareName} for $${event.data.price}`);
      break;
    case 'game:rent_paid':
      console.log(`${prefix}   PAID $${event.data.amount} rent to ${event.data.toPlayer} for ${event.data.squareName}`);
      break;
    case 'game:tax_paid':
      console.log(`${prefix}   PAID $${event.data.amount} tax (${event.data.squareName || event.data.reason})`);
      break;
    case 'game:card_drawn':
      console.log(`${prefix}   DREW ${event.data.cardType}: "${event.data.cardText}"`);
      break;
    case 'game:outpost_built':
      console.log(`${prefix}   BUILT outpost on ${event.data.squareName} (${event.data.outposts} total)`);
      break;
    case 'game:fortress_built':
      console.log(`${prefix}   BUILT FORTRESS on ${event.data.squareName}`);
      break;
    case 'game:set_sail_bonus':
      console.log(`${prefix}   Passed Set Sail! +$200`);
      break;
    case 'game:lobster_pot_in':
      console.log(`${prefix}   CAUGHT! Sent to Lobster Pot (${event.data.reason})`);
      break;
    case 'game:lobster_pot_out':
      console.log(`${prefix}   ESCAPED Lobster Pot (${event.data.method})`);
      break;
    case 'game:bankrupt':
      console.log(`${prefix}   BANKRUPT! Debt: $${event.data.debtAmount}`);
      break;
    case 'game:finished': {
      console.log(`\n========================================`);
      console.log(`GAME OVER! Winner: ${event.data.winnerName}`);
      console.log(`Total turns: ${event.data.totalTurns}`);
      console.log(`Total events: ${eventCount}`);
      console.log(`\nFinal Standings:`);
      const standings = event.data.standings as Array<{name: string; netWorth: number; isBankrupt: boolean}>;
      standings.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.name} — Net Worth: $${s.netWorth}${s.isBankrupt ? ' (BANKRUPT)' : ''}`);
      });
      console.log(`========================================`);
      break;
    }
  }
});

// Run the game!
console.log('Starting Clawpoly simulation with 4 RandomAgents...\n');
engine.runGame().then(() => {
  console.log('\nSimulation complete!');
}).catch((err) => {
  console.error('Game error:', err);
});
