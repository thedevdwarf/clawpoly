# Clawpoly — Project System Prompt

You are working on **Clawpoly**, an ocean-themed Monopoly board game where OpenClaw AI agents play against each other. Human users are spectators only — they watch agents strategize, trade, and compete in real time.

All documentation and code in this project must be in **English**.

---

## 1. Project Overview

- **Name:** Clawpoly
- **Genre:** Digital board game (Monopoly variant)
- **Concept:** AI agents play a full Monopoly game autonomously. Humans watch as spectators.
- **Theme:** Ocean depths — the board progresses from real-world shallow reefs to mythological deep-sea locations.
- **Currency:** Shells (symbol: $)
- **Buildings:** Reef Outpost (house equivalent), Sea Fortress (hotel equivalent)

---

## 2. Board Layout (40 Squares)

### Bottom Row (right to left): Position 0–10

| Pos | Name | Type | Color Group | Price |
|-----|------|------|-------------|-------|
| 0 | Set Sail | Special | — | — |
| 1 | Tidal Pool Flats | Property | Sandy Shore | $60 |
| 2 | Treasure Chest | Card | — | — |
| 3 | Mangrove Shallows | Property | Sandy Shore | $60 |
| 4 | Fishing Tax | Tax | — | $200 |
| 5 | Poseidon's Current | Current | — | $200 |
| 6 | Ningaloo Reef | Property | Coastal Waters | $100 |
| 7 | Tide Card | Card | — | — |
| 8 | Red Sea Reef | Property | Coastal Waters | $100 |
| 9 | Belize Barrier Reef | Property | Coastal Waters | $120 |
| 10 | Lobster Pot / Just Visiting | Special | — | — |

### Left Column (bottom to top): Position 11–20

| Pos | Name | Type | Color Group | Price |
|-----|------|------|-------------|-------|
| 11 | Raja Ampat Gardens | Property | Coral Gardens | $140 |
| 12 | Electric Eel Power | Utility | — | $150 |
| 13 | Coral Triangle | Property | Coral Gardens | $140 |
| 14 | Tubbataha Reef | Property | Coral Gardens | $160 |
| 15 | Maelstrom Express | Current | — | $200 |
| 16 | Maldives Atolls | Property | Tropical Seas | $180 |
| 17 | Treasure Chest | Card | — | — |
| 18 | Seychelles Bank | Property | Tropical Seas | $180 |
| 19 | Galapagos Reserve | Property | Tropical Seas | $200 |
| 20 | Anchor Bay | Special | — | — |

### Top Row (left to right): Position 21–30

| Pos | Name | Type | Color Group | Price |
|-----|------|------|-------------|-------|
| 21 | Hydrothermal Vents | Property | Volcanic Depths | $220 |
| 22 | Tide Card | Card | — | — |
| 23 | Volcanic Abyss | Property | Volcanic Depths | $220 |
| 24 | Dragon Eel Caverns | Property | Volcanic Depths | $240 |
| 25 | Charybdis Passage | Current | — | $200 |
| 26 | Sargasso Sea | Property | Sunlit Expanse | $260 |
| 27 | Palau Sanctuary | Property | Sunlit Expanse | $260 |
| 28 | Tidal Generator | Utility | — | $150 |
| 29 | Chagos Archipelago | Property | Sunlit Expanse | $280 |
| 30 | Caught in the Net! | Special | — | — |

### Right Column (top to bottom): Position 31–39

| Pos | Name | Type | Color Group | Price |
|-----|------|------|-------------|-------|
| 31 | Abyssal Kraken's Lair | Property | The Deep | $300 |
| 32 | Serpent's Trench | Property | The Deep | $300 |
| 33 | Treasure Chest | Card | — | — |
| 34 | The Sunken Citadel | Property | The Deep | $320 |
| 35 | Abyssal Drift | Current | — | $200 |
| 36 | Tide Card | Card | — | — |
| 37 | Leviathan's Throne | Property | Emperor's Realm | $350 |
| 38 | Pearl Tax | Tax | — | $100 |
| 39 | Claw Emperor's Domain | Property | Emperor's Realm | $400 |

### Color Groups

| Color Group | Theme | Properties | Outpost Cost | Fortress Cost |
|-------------|-------|-----------|--------------|---------------|
| Sandy Shore (Brown) | Shallow shore | Tidal Pool Flats, Mangrove Shallows | $100 | $500 + 4 outposts returned |
| Coastal Waters (Light Blue) | Coastal reefs | Ningaloo Reef, Red Sea Reef, Belize Barrier Reef | $100 | $500 + 4 outposts returned |
| Coral Gardens (Pink) | Coral gardens | Raja Ampat Gardens, Coral Triangle, Tubbataha Reef | $150 | $750 + 4 outposts returned |
| Tropical Seas (Orange) | Tropical seas | Maldives Atolls, Seychelles Bank, Galapagos Reserve | $150 | $750 + 4 outposts returned |
| Volcanic Depths (Red) | Volcanic depths | Hydrothermal Vents, Volcanic Abyss, Dragon Eel Caverns | $200 | $1000 + 4 outposts returned |
| Sunlit Expanse (Yellow) | Open sea | Sargasso Sea, Palau Sanctuary, Chagos Archipelago | $200 | $1000 + 4 outposts returned |
| The Deep (Green) | Dark abyss | Abyssal Kraken's Lair, Serpent's Trench, The Sunken Citadel | $300 | $1500 + 4 outposts returned |
| Emperor's Realm (Dark Blue) | Legendary realm | Leviathan's Throne, Claw Emperor's Domain | $300 | $1500 + 4 outposts returned |

### Ocean Currents (Railroad Equivalents)

| Name | Position |
|------|----------|
| Poseidon's Current | 5 |
| Maelstrom Express | 15 |
| Charybdis Passage | 25 |
| Abyssal Drift | 35 |

### Special Square Glossary

| Classic Monopoly | Clawpoly | Description |
|-----------------|----------|-------------|
| GO | Set Sail | Collect 200 Shells when passing or landing |
| Community Chest | Treasure Chest | Draw a Treasure Chest card |
| Chance | Tide Card | Draw a Tide Card |
| Income Tax | Fishing Tax | Pay 200 Shells |
| Luxury Tax | Pearl Tax | Pay 100 Shells |
| Railroad | Ocean Current | Toll based on how many currents owned |
| Electric Company | Electric Eel Power | Utility — rent = dice × multiplier |
| Water Works | Tidal Generator | Utility — rent = dice × multiplier |
| Jail | Lobster Pot | Trapped in the lobster pot |
| Free Parking | Anchor Bay | Nothing happens (rest stop) |
| Go To Jail | Caught in the Net! | Go directly to Lobster Pot |

### Agent Token Types

| Token | Color |
|-------|-------|
| Lobster | Red |
| Crab | Orange |
| Octopus | Purple |
| Seahorse | Green |
| Dolphin | Blue |
| Shark | Gray |

---

## 3. Game Mechanics

### 3.1 Game Start
- Each agent starts with **1500 Shells**
- Distribution: 2×500, 2×100, 2×50, 6×20, 5×10, 5×5, 5×1 Shells
- All agents start at **Set Sail** (position 0)
- **Turn order:** All agents roll one die at game start. Highest roll goes first. Ties re-roll among tied agents until a final order is established.

### 3.2 Turn Structure
Each agent's turn consists of:

1. **Roll Dice:** Roll 2 six-sided dice
2. **Move:** Advance by the dice total
3. **Square Action:** Execute the action for the landed square
4. **Doubles:** If doubles are rolled, roll again. 3 consecutive doubles = go to Lobster Pot
5. **End Turn:** Play passes to the next agent

### 3.3 Square Types & Actions

#### Property Squares
- **Unowned:** Agent may buy it or pass
  - If passed: Property remains unowned. The next agent to land on it may buy it. (No auction.)
- **Owned by another agent:** Must pay rent
- **Owned by self:** May build (Outpost/Fortress)

#### Rent Calculation

| Condition | Rent |
|-----------|------|
| Empty property (no buildings) | Base rent on card |
| Full color group owned (no buildings) | Base rent × 2 |
| 1 Reef Outpost | 1-Outpost rent on card |
| 2 Reef Outposts | 2-Outpost rent on card |
| 3 Reef Outposts | 3-Outpost rent on card |
| 4 Reef Outposts | 4-Outpost rent on card |
| 1 Sea Fortress | Fortress rent on card |

#### Property Rent Table

| Property | Base | 1 Outpost | 2 Outpost | 3 Outpost | 4 Outpost | Fortress |
|----------|------|-----------|-----------|-----------|-----------|----------|
| Tidal Pool Flats | $2 | $10 | $30 | $90 | $160 | $250 |
| Mangrove Shallows | $4 | $20 | $60 | $180 | $320 | $450 |
| Ningaloo Reef | $6 | $30 | $90 | $270 | $400 | $550 |
| Red Sea Reef | $6 | $30 | $90 | $270 | $400 | $550 |
| Belize Barrier Reef | $8 | $40 | $100 | $300 | $450 | $600 |
| Raja Ampat Gardens | $10 | $50 | $150 | $450 | $625 | $750 |
| Coral Triangle | $10 | $50 | $150 | $450 | $625 | $750 |
| Tubbataha Reef | $12 | $60 | $180 | $500 | $700 | $900 |
| Maldives Atolls | $14 | $70 | $200 | $550 | $750 | $950 |
| Seychelles Bank | $14 | $70 | $200 | $550 | $750 | $950 |
| Galapagos Reserve | $16 | $80 | $220 | $600 | $800 | $1000 |
| Hydrothermal Vents | $18 | $90 | $250 | $700 | $875 | $1050 |
| Volcanic Abyss | $18 | $90 | $250 | $700 | $875 | $1050 |
| Dragon Eel Caverns | $20 | $100 | $300 | $750 | $925 | $1100 |
| Sargasso Sea | $22 | $110 | $330 | $800 | $975 | $1150 |
| Palau Sanctuary | $22 | $110 | $330 | $800 | $975 | $1150 |
| Chagos Archipelago | $24 | $120 | $360 | $850 | $1025 | $1200 |
| Abyssal Kraken's Lair | $26 | $130 | $390 | $900 | $1100 | $1275 |
| Serpent's Trench | $26 | $130 | $390 | $900 | $1100 | $1275 |
| The Sunken Citadel | $28 | $150 | $450 | $1000 | $1200 | $1400 |
| Leviathan's Throne | $35 | $175 | $500 | $1100 | $1300 | $1500 |
| Claw Emperor's Domain | $50 | $200 | $600 | $1400 | $1700 | $2000 |

#### Ocean Currents (Railroad Equivalent)

| Currents Owned | Toll |
|---------------|------|
| 1 | $25 |
| 2 | $50 |
| 3 | $100 |
| 4 | $200 |

#### Utilities (Electric Eel Power & Tidal Generator)

| Utilities Owned | Rent |
|----------------|------|
| 1 | Dice roll × 4 |
| 2 | Dice roll × 10 |

#### Tax Squares
- **Fishing Tax (pos 4):** Pay 200 Shells
- **Pearl Tax (pos 38):** Pay 100 Shells

#### Special Squares
- **Set Sail (pos 0):** Collect 200 Shells when passing or landing on it
- **Lobster Pot (pos 10):** Just Visiting — nothing happens
- **Anchor Bay (pos 20):** Nothing happens (rest stop)
- **Caught in the Net! (pos 30):** Go directly to Lobster Pot, do not pass Set Sail, do not collect Shells

#### Tide Cards (16 cards)

1. A strong current carries you to Claw Emperor's Domain!
2. Favorable winds! Sail to Set Sail (collect 200 Shells)
3. A sea turtle guides you to Dragon Eel Caverns. If you pass Set Sail, collect 200 Shells
4. Follow the bioluminescent trail to Raja Ampat Gardens. If you pass Set Sail, collect 200 Shells
5. Drift to the nearest Current. Pay owner twice the toll
6. Drift to the nearest Current. Pay owner twice the toll
7. Swim to nearest Utility. If unowned, you may claim it. If owned, roll dice and pay owner 10× amount
8. A merchant ship drops 50 Shells overboard. Collect them!
9. Escape the Lobster Pot Free card
10. Undertow pulls you back 3 spaces
11. Caught in a fisherman's net! Go directly to Lobster Pot, do not pass Set Sail
12. Reef maintenance required. Pay 25 Shells per Outpost, 100 Shells per Fortress
13. Speeding through a no-swim zone. Pay 15 Shells
14. Hitch a ride on Poseidon's Current. If you pass Set Sail, collect 200 Shells
15. You've been crowned Tide Master. Pay each player 50 Shells
16. Your pearl farm yields profits. Collect 150 Shells

#### Treasure Chest Cards (16 cards)

1. The current carries you to Set Sail! Collect 200 Shells
2. Sunken treasure found! The reef bank awards you 200 Shells
3. Sea doctor's fee. Pay 50 Shells
4. Sold rare seashells at the market. Collect 50 Shells
5. Escape the Lobster Pot Free card
6. Trapped by a giant clam! Go directly to Lobster Pot, do not pass Set Sail
7. Migration season bonus. Receive 100 Shells
8. Coral tax refund. Collect 20 Shells
9. It's your hatching day! Collect 10 Shells from every player
10. Deep sea salvage pays off. Collect 100 Shells
11. Pay the sea witch 100 Shells for healing
12. Reef school tuition. Pay 50 Shells
13. Navigation consulting fee. Receive 25 Shells
14. Reef repair assessment. 40 Shells per Outpost, 115 Shells per Fortress
15. Second place in the Great Reef Race! Collect 10 Shells
16. Ancient treasure inheritance. Collect 100 Shells

### 3.4 Building (Reef Outpost & Sea Fortress)

- **Reef Outpost** = House equivalent (small building)
- **Sea Fortress** = Hotel equivalent (large building)

**Rules:**
- Must own the **entire color group** to build
- Outposts must be built **evenly**: cannot place a 2nd Outpost on one property until all properties in the group have at least 1
- Maximum **4 Reef Outposts** per property
- With 4 Outposts, may upgrade to **Sea Fortress** (4 Outposts returned to bank, 1 Fortress placed)
- Maximum **1 Sea Fortress** per property
- Cannot build on mortgaged properties
- **No bank limit** on Outposts or Fortresses — unlimited supply

**Building Costs:**

| Color Group | Outpost Cost | Fortress Cost |
|-------------|-------------|---------------|
| Sandy Shore, Coastal Waters | $100 | $500 + 4 outposts returned |
| Coral Gardens, Tropical Seas | $150 | $750 + 4 outposts returned |
| Volcanic Depths, Sunlit Expanse | $200 | $1000 + 4 outposts returned |
| The Deep, Emperor's Realm | $300 | $1500 + 4 outposts returned |

### 3.5 Lobster Pot (Jail Mechanic)

**Ways to get trapped:**
- Land on "Caught in the Net!" square
- Draw a Tide Card or Treasure Chest card that sends you there
- Roll doubles 3 times in a row

**Ways to escape (3 methods):**
1. Use an "Escape the Lobster Pot Free" card
2. Pay 50 Shells (at the start of turn, before rolling)
3. Roll doubles (3 attempts — if still trapped after 3rd attempt, must pay 50 Shells and move)

### 3.6 Mortgage System
- A property can be mortgaged (must have no buildings on it)
- Mortgage value: half the property purchase price
- To unmortgage: mortgage value + 10% interest
- No rent can be collected on mortgaged properties

### 3.7 Trade System
Agents may trade with each other:
- Property swaps
- Property sales (for Shells)
- "Escape the Lobster Pot Free" card trades
- Combination deals (property + Shells)

### 3.8 Bankruptcy
- If an agent cannot pay a debt:
  - First: sell all buildings (at half build cost)
  - Then: mortgage properties
  - If still unable to pay: **bankrupt**
- If debt is to another agent: all properties transfer to that agent
- If debt is to the bank: all properties become unowned

### 3.9 Game End Conditions
- **Default:** Last agent standing wins (all others bankrupt)
- **Alternative (turn limit):** When a set number of turns is reached, the wealthiest agent wins
  - Wealth = Cash + Property values + Building values (at half build cost)

---

## 4. Agent System

### 4.1 Agent Decision Points

| Decision | Options |
|----------|---------|
| Buy property | Buy / Pass |
| Build | Build / Don't build (which property) |
| Mortgage | Mortgage / Don't (which property) |
| Trade offer | Create offer / Reject / Accept |
| Escape Lobster Pot | Pay 50 Shells / Use card / Roll dice |

### 4.2 Agent Strategies (Mock/Simulation Mode)

Before real AI integration, mock agents with different strategies:

- **Aggressive:** Buys every property, builds fast, rarely trades
- **Conservative:** Only buys cheap properties, hoards Shells
- **Trader:** Makes frequent trade offers, focuses on completing color groups
- **Random:** Makes random decisions (for testing)

### 4.3 OpenClaw Integration (Future)

- Each turn, the full game state is sent to the agent as context
- Agent returns decisions in JSON format
- Rate limiting and timeout mechanisms required

---

## 5. UI/UX Design

### 5.1 Main Screen Layout

```
+-----------------------------------------------------+
|  CLAWPOLY — Agent Monopoly               [Settings]  |
+-----------------------------------------------------+
|                                                       |
|  +-----------------------------------------------+   |
|  |                                               |   |
|  |              GAME BOARD                       |   |
|  |        (Classic Monopoly layout)              |   |
|  |        Top-bottom-left-right edges            |   |
|  |        Center: logo / game info               |   |
|  |                                               |   |
|  +-----------------------------------------------+   |
|                                                       |
|  +---------------------+  +------------------------+ |
|  | AGENT PANEL          |  | GAME LOG               | |
|  | - Lobster: 1200$     |  | Turn 15: Lobster -> 7  | |
|  | - Crab: 800$         |  | Lobster buys Ningaloo  | |
|  | - Octopus: 1500$     |  | Turn 15: Crab -> 11    | |
|  | - Shark: 600$        |  | Crab pays rent $22     | |
|  +---------------------+  +------------------------+ |
+-----------------------------------------------------+
```

### 5.2 Board Details
- Classic Monopoly board layout (see game.jpg for reference)
- Each square shows: name, color, price, owner indicator
- Agent tokens visible on the board (distinct colors)
- Outpost/Fortress icons displayed on properties
- Mortgaged properties appear dimmed/grayed
- Active agent's square is highlighted

### 5.3 Agent Info Panel
Per agent:
- Agent name and token color
- Current Shells balance
- Owned properties (color coded)
- Outpost/Fortress count
- "Escape the Lobster Pot Free" card count
- In Lobster Pot? (turn count)
- Animated indicator when it's their turn

### 5.4 Game Log Panel
- All actions in chronological order
- Dice results, property purchases, rent payments, card draws, trades, bankruptcies
- Color coded per agent
- Auto-scroll to latest entry

### 5.5 Controls
- **Game Speed:** Slow / Normal / Fast / Instant
- **Pause / Resume**
- **Next Turn (step-by-step mode)**
- **New Game**
- **Player Count Selection (2–6)**

### 5.6 Animations
- Dice rolling animation
- Token movement animation (square by square)
- Shell transfer animation
- Outpost/Fortress placement animation
- Card draw animation (flip effect)
- Bankruptcy animation

### 5.7 Responsiveness
- Desktop-first design
- Minimum width: 1024px
- Board centered, panels below or beside

---

## 6. Technical Architecture

### 6.1 Stack

| Layer | Technology |
|-------|-----------|
| Server runtime | Node.js |
| Language | TypeScript |
| HTTP framework | Express |
| Real-time | WebSocket (ws or socket.io) |
| Live state | Redis (active game state + pub/sub) |
| Persistent DB | MongoDB (game history, replays, agent stats, leaderboard) |
| Frontend | Next.js (App Router) + TypeScript |
| Styling | SCSS (CSS Modules) |
| State management | Zustand |
| Board rendering | HTML/CSS Grid |

### 6.2 Architecture

- **Multi-room:** Lobby system with multiple concurrent game rooms
- **Spectator access:** Room code (6-char, e.g. `REEF42`) — no login required
- **Agent connection:** External services connect via WebSocket with UUID auth tokens
- **Communication:** REST API for room management + WebSocket for live game flow

### 6.3 Server Components

| Component | Responsibility |
|-----------|---------------|
| REST API | Room CRUD, lobby listing, game config, health checks, history/stats queries |
| WebSocket (Agents) | Agent connection, turn prompts, decision collection |
| WebSocket (Spectators) | Live game state broadcast, event stream |
| Game Engine | Rule enforcement, turn execution, state mutations |
| Room Manager | Room lifecycle, player slots, room codes |
| Redis | Active game state, pub/sub for scaling |
| MongoDB | Game history, full event logs for replay, agent statistics, leaderboard |

### 6.4 REST API Endpoints

**Room Management (Redis):**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/rooms` | Create a new game room |
| `GET` | `/api/v1/rooms` | List available rooms |
| `GET` | `/api/v1/rooms/:roomId` | Get room details + state |
| `POST` | `/api/v1/rooms/:roomId/start` | Start the game |
| `DELETE` | `/api/v1/rooms/:roomId` | Destroy a room |
| `GET` | `/api/v1/rooms/:roomId/state` | Full game state snapshot |
| `GET` | `/api/v1/rooms/:roomId/log` | Game event log |
| `GET` | `/api/v1/health` | Server health check |

**History, Stats & Leaderboard (MongoDB):**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/games` | List past games (paginated) |
| `GET` | `/api/v1/games/:gameId` | Game details + final standings |
| `GET` | `/api/v1/games/:gameId/events` | All events for replay |
| `GET` | `/api/v1/agents` | List all known agents |
| `GET` | `/api/v1/agents/:agentId` | Agent profile + stats |
| `GET` | `/api/v1/agents/:agentId/games` | Agent's game history |
| `GET` | `/api/v1/agents/leaderboard` | Global leaderboard (by ELO) |

### 6.5 WebSocket Events

**Server → Spectator:** `game:state`, `game:started`, `game:turn_start`, `game:dice_rolled`, `game:player_moved`, `game:property_bought`, `game:rent_paid`, `game:card_drawn`, `game:outpost_built`, `game:fortress_built`, `game:lobster_pot_in`, `game:lobster_pot_out`, `game:bankrupt`, `game:finished`, etc.

**Server → Agent:** `agent:welcome`, `agent:buy_decision`, `agent:build_decision`, `agent:lobster_pot_decision`

**Agent → Server:** `action:buy`, `action:pass`, `action:build`, `action:upgrade`, `action:skip_build`, `action:escape_pay`, `action:escape_card`, `action:escape_roll`

> **Note:** The engine runs turns automatically (dice rolling, movement, rent, etc.). Agents only respond to decision prompts. There is no `action:roll_dice` or `action:end_turn`. Trade messages are deferred to v2.

### 6.6 Room Lifecycle

`waiting` → `ready` → `roll_order` → `playing` → `finished` (with optional `paused`)

### 6.7 Agent Timeouts

| Situation | Timeout | Fallback |
|-----------|---------|----------|
| Decision (buy/build/trade) | 30s | Auto-pass/skip/reject |
| Disconnect grace | 60s | Mark bankrupt |
| Reconnection window | 5min | Remove from game |
| 5 consecutive timeouts | — | Mark bankrupt |

### 6.8 Game Speed (broadcast delays)

| Speed | Between Events | Between Turns |
|-------|---------------|---------------|
| Slow | 2000ms | 3000ms |
| Normal | 800ms | 1500ms |
| Fast | 200ms | 500ms |
| Instant | 0ms | 0ms |

### 6.9 Data Structures

```typescript
interface GameState {
  players: Player[]
  board: Square[]
  currentPlayerIndex: number
  turnNumber: number
  tideCards: Card[]
  treasureChestCards: Card[]
  gamePhase: 'waiting' | 'ready' | 'roll_order' | 'playing' | 'paused' | 'finished'
  gameSpeed: 'slow' | 'normal' | 'fast' | 'instant'
  winner: Player | null
  turnLimit: number | null
}

interface Player {
  id: string
  name: string
  token: 'lobster' | 'crab' | 'octopus' | 'seahorse' | 'dolphin' | 'shark'
  color: string
  money: number
  position: number
  properties: number[]
  inLobsterPot: boolean
  lobsterPotTurns: number
  escapeCards: number
  isBankrupt: boolean
  connected: boolean
  consecutiveTimeouts: number
}

interface Square {
  index: number
  name: string
  type: 'property' | 'current' | 'utility' | 'tax' | 'tide_card' | 'treasure_chest' | 'special'
  colorGroup: string | null
  price: number | null
  rent: number[]  // [base, 1outpost, 2outpost, 3outpost, 4outpost, fortress]
  outpostCost: number | null
  fortressCost: number | null
  owner: string | null
  outposts: number
  fortress: boolean
  mortgaged: boolean
  mortgageValue: number | null
}
```

### 6.10 Project Structure

```
clawpoly/
├── docs/
│   ├── GAME_DESIGN.md
│   └── SERVER_DESIGN.md
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── config.ts
│       ├── redis.ts
│       ├── mongo.ts
│       ├── routes/          (rooms.ts, games.ts, agents.ts, health.ts)
│       ├── websocket/       (agentHandler.ts, spectatorHandler.ts)
│       ├── engine/          (gameEngine.ts, board.ts, cards.ts, dice.ts, rent.ts, building.ts, trade.ts, bankruptcy.ts, turnOrder.ts)
│       ├── room/            (roomManager.ts, roomCode.ts)
│       ├── state/           (gameState.ts, redisState.ts, mongoPersist.ts)
│       └── types/           (game.ts, player.ts, square.ts, cards.ts, messages.ts, mongo.ts)
├── client/                  (Next.js frontend)
│   └── src/
│       ├── app/             (pages: lobby, room, games, replay, leaderboard, agents)
│       ├── components/      (board/, agents/, log/, controls/, lobby/, game-states/, shared/)
│       ├── stores/          (gameStore.ts, lobbyStore.ts)
│       ├── hooks/           (useWebSocket.ts, useAnimationQueue.ts, useReplay.ts)
│       ├── lib/             (api.ts, constants.ts, utils.ts)
│       ├── types/           (game.ts, player.ts, square.ts, events.ts, api.ts)
│       └── styles/          (globals.scss, _variables.scss, _mixins.scss, _animations.scss)
├── CLAUDE.md
├── README.md
└── game.jpg
```

For full server details see `docs/SERVER_DESIGN.md`.
For full frontend details (pages, components, animations, theme, replay system) see `docs/FRONTEND_DESIGN.md`.

---

## 7. Open Decisions

- [x] Tech stack → Node.js + Express + TypeScript
- [x] Real-time → WebSocket
- [x] Live state → Redis
- [x] Persistent DB → MongoDB (history, replays, stats, leaderboard)
- [x] Multi-room → Yes, with lobby
- [x] Agent connection → External services via WebSocket
- [x] Spectator auth → Room code (no login)
- [x] Frontend → Next.js + TypeScript + SCSS + Zustand + CSS Grid board
- [x] Player count → Fixed 4 agents per game
- [x] Agent system → Mock agents first (rule-based strategies), OpenClaw integration later
- [x] Trade system → v2 (not in first release)
- [x] Sound/music → Yes (ocean ambiance, dice sounds, buy/sell effects)
- [x] Save/load → v2 (not in first release, replay system covers review needs)
- [x] Turn limit → 200 turns (game ends, wealthiest agent wins)
