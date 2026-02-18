import { GameState } from './types/game';
import { Player, TOKEN_COLORS, TokenType } from './types/player';
import { AgentDecision } from './types/agent';
import { GameEngine } from './engine/gameEngine';
import { RandomAgent } from './engine/agents/randomAgent';
import { determineTurnOrder } from './engine/turnOrder';
import { createBoard } from './engine/board';
import { createTideCards, createTreasureChestCards } from './engine/cards';
import { calculateNetWorth } from './engine/bankruptcy';

// --- Create 4 players ---
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
  escapeCards: [],
  isBankrupt: false,
  connected: true,
  consecutiveTimeouts: 0,
}));

// --- Build game state directly (no Redis/MongoDB) ---
const board = createBoard();
const tideCards = createTideCards();
const treasureChestCards = createTreasureChestCards();

const state: GameState = {
  roomId: 'test-room',
  roomCode: 'TEST01',
  roomName: 'E2E Engine Test',
  players: [...players],
  board,
  currentPlayerIndex: 0,
  turnNumber: 0,
  tideCards,
  treasureChestCards,
  gamePhase: 'waiting',
  gameSpeed: 'instant',
  winner: null,
  turnLimit: 100,
};

// --- Determine turn order ---
const orderResult = determineTurnOrder(players.map((p) => p.id));
console.log('Turn order:');
orderResult.order.forEach((id, i) => {
  const p = players.find((pl) => pl.id === id)!;
  console.log(`  ${i + 1}. ${p.name} (rolled ${orderResult.rolls[id]})`);
});
state.players = orderResult.order.map((id) => players.find((p) => p.id === id)!);

// --- Create agents ---
const agents = new Map<string, AgentDecision>();
for (const player of state.players) {
  agents.set(player.id, new RandomAgent());
}

// --- Event logging ---
const engine = new GameEngine(state, agents);

let eventCount = 0;
let purchaseCount = 0;
let rentCount = 0;
let bankruptCount = 0;

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
      purchaseCount++;
      console.log(`${prefix}   BOUGHT ${event.data.squareName} for $${event.data.price}`);
      break;
    case 'game:rent_paid':
      rentCount++;
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
      bankruptCount++;
      console.log(`${prefix}   BANKRUPT! Debt: $${event.data.debtAmount}`);
      break;
    case 'game:finished':
      // Handled after runGame completes
      break;
  }
});

// --- Run the game ---
console.log('\nStarting Clawpoly E2E simulation with 4 RandomAgents (turnLimit=100)...\n');

engine.runGame().then(() => {
  const finalState = engine.getState();

  console.log('\n========================================');
  console.log('GAME OVER!');
  console.log('========================================');

  if (finalState.winner) {
    console.log(`Winner: ${finalState.winner.name}`);
  }

  console.log(`Total turns: ${finalState.turnNumber}`);
  console.log(`Total events: ${eventCount}`);
  console.log(`Purchases: ${purchaseCount} | Rent payments: ${rentCount} | Bankruptcies: ${bankruptCount}`);

  console.log('\nFinal Standings:');
  console.log('─'.repeat(60));

  const standings = finalState.players
    .map((p) => ({
      name: p.name,
      money: p.money,
      netWorth: calculateNetWorth(p, finalState.board),
      properties: p.properties.length,
      isBankrupt: p.isBankrupt,
    }))
    .sort((a, b) => b.netWorth - a.netWorth);

  standings.forEach((s, i) => {
    const status = s.isBankrupt ? ' (BANKRUPT)' : '';
    console.log(
      `  ${i + 1}. ${s.name} — Cash: $${s.money} | Net Worth: $${s.netWorth} | Properties: ${s.properties}${status}`
    );
  });

  console.log('─'.repeat(60));
  console.log('\nSimulation complete!');
}).catch((err) => {
  console.error('Game error:', err);
  process.exit(1);
});
