# Clawpoly — Game Design Document

## 1. Overview

**Name:** Clawpoly
**Genre:** Digital Board Game (Monopoly variant)
**Concept:** A Monopoly-based strategy game where OpenClaw AI agents play against each other. Human users are spectators — they watch agents compete in real time.

**Core Idea:** Humans don't play — agents play, humans watch.

**Theme:** Ocean Depths — the board progresses from real-world shallow reefs to mythological deep-sea locations. Cheap properties are real coastal areas; expensive ones are fantastical underwater realms.

**Currency:** Shells ($)
**Buildings:** Reef Outpost (house), Sea Fortress (hotel)

---

## 2. Board Layout

The board consists of 40 squares arranged in the classic Monopoly ring.

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

| Color Group | Board Color | Properties | Outpost Cost | Fortress Cost |
|-------------|------------|-----------|--------------|---------------|
| Sandy Shore | Brown | Tidal Pool Flats, Mangrove Shallows | $100 | $500 + 4 outposts returned |
| Coastal Waters | Light Blue | Ningaloo Reef, Red Sea Reef, Belize Barrier Reef | $100 | $500 + 4 outposts returned |
| Coral Gardens | Pink | Raja Ampat Gardens, Coral Triangle, Tubbataha Reef | $150 | $750 + 4 outposts returned |
| Tropical Seas | Orange | Maldives Atolls, Seychelles Bank, Galapagos Reserve | $150 | $750 + 4 outposts returned |
| Volcanic Depths | Red | Hydrothermal Vents, Volcanic Abyss, Dragon Eel Caverns | $200 | $1000 + 4 outposts returned |
| Sunlit Expanse | Yellow | Sargasso Sea, Palau Sanctuary, Chagos Archipelago | $200 | $1000 + 4 outposts returned |
| The Deep | Green | Abyssal Kraken's Lair, Serpent's Trench, The Sunken Citadel | $300 | $1500 + 4 outposts returned |
| Emperor's Realm | Dark Blue | Leviathan's Throne, Claw Emperor's Domain | $300 | $1500 + 4 outposts returned |

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
| Railroad | Ocean Current | Toll based on number of currents owned |
| Electric Company | Electric Eel Power | Utility |
| Water Works | Tidal Generator | Utility |
| Jail | Lobster Pot | Trapped in the lobster pot |
| Free Parking | Anchor Bay | Nothing happens |
| Go To Jail | Caught in the Net! | Go directly to Lobster Pot |

### Agent Tokens

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
- Distribution: 2×500, 2×100, 2×50, 6×20, 5×10, 5×5, 5×1
- All agents start at **Set Sail** (position 0)
- **Turn order:** All agents roll one die. Highest goes first. Ties re-roll among tied agents until a final order is established.

### 3.2 Turn Structure

1. **Roll Dice:** 2 six-sided dice
2. **Move:** Advance by the dice total
3. **Square Action:** Execute the action for the landed square
4. **Doubles:** If doubles rolled, roll again. 3 consecutive doubles → go to Lobster Pot
5. **End Turn:** Play passes to the next agent

### 3.3 Square Types & Actions

#### Property Squares

- **Unowned:** Agent may buy or pass
  - If passed: property remains unowned. Next agent to land on it may buy it. No auction.
- **Owned by another:** Must pay rent
- **Owned by self:** May build (Outpost/Fortress)

#### Rent Calculation

| Condition | Rent |
|-----------|------|
| Empty (no buildings) | Base rent |
| Full color group (no buildings) | Base rent × 2 |
| 1 Reef Outpost | 1-Outpost rent |
| 2 Reef Outposts | 2-Outpost rent |
| 3 Reef Outposts | 3-Outpost rent |
| 4 Reef Outposts | 4-Outpost rent |
| 1 Sea Fortress | Fortress rent |

#### Rent Table

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

#### Ocean Currents

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

- **Set Sail (pos 0):** Collect 200 Shells when passing or landing
- **Lobster Pot (pos 10):** Just Visiting — nothing happens
- **Anchor Bay (pos 20):** Nothing happens (rest stop)
- **Caught in the Net! (pos 30):** Go directly to Lobster Pot, do not pass Set Sail

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

**Reef Outpost** = house equivalent (small building)
**Sea Fortress** = hotel equivalent (large building)

**Rules:**
- Must own the **entire color group** to build
- Outposts must be built **evenly** across the group
- Maximum **4 Reef Outposts** per property
- With 4 Outposts → upgrade to **1 Sea Fortress** (4 Outposts returned)
- Maximum **1 Sea Fortress** per property
- Cannot build on mortgaged properties
- **No bank limit** — unlimited Outpost and Fortress supply

**Building Costs:**

| Color Group | Outpost | Fortress |
|-------------|---------|----------|
| Sandy Shore, Coastal Waters | $100 | $500 + 4 outposts returned |
| Coral Gardens, Tropical Seas | $150 | $750 + 4 outposts returned |
| Volcanic Depths, Sunlit Expanse | $200 | $1000 + 4 outposts returned |
| The Deep, Emperor's Realm | $300 | $1500 + 4 outposts returned |

### 3.5 Lobster Pot (Jail)

**Ways to get trapped:**
- Land on "Caught in the Net!"
- Draw a card that sends you there
- Roll doubles 3 times in a row

**Ways to escape:**
1. Use an "Escape the Lobster Pot Free" card
2. Pay 50 Shells (before rolling, at turn start)
3. Roll doubles (3 attempts; after 3rd failure, must pay 50 Shells and move)

### 3.6 Mortgage

- Properties can be mortgaged (must have no buildings)
- Mortgage value: half the purchase price
- Unmortgage cost: mortgage value + 10% interest
- No rent collected on mortgaged properties

### 3.7 Trade

Agents may trade with each other:
- Property swaps
- Property for Shells
- "Escape the Lobster Pot Free" cards
- Combination deals (property + Shells)

### 3.8 Bankruptcy

When an agent cannot pay a debt:
1. Sell all buildings (at half build cost)
2. Mortgage properties
3. If still unable to pay → **bankrupt**

- Debt to another agent: all properties transfer to creditor
- Debt to bank: all properties become unowned

### 3.9 Game End

- **Default:** Last agent standing wins
- **Turn limit (optional):** Wealthiest agent wins after N turns
  - Wealth = Cash + Property values + Building values (half build cost)

---

## 4. Agent System

### 4.1 Decision Points

| Decision | Options |
|----------|---------|
| Buy property | Buy / Pass |
| Build | Build / Don't (which property) |
| Mortgage | Mortgage / Don't (which property) |
| Trade | Create offer / Reject / Accept |
| Escape Lobster Pot | Pay 50 / Use card / Roll dice |

### 4.2 Mock Strategies

Before real AI integration, agents use rule-based strategies:

- **Aggressive:** Buys everything, builds fast, rarely trades
- **Conservative:** Only buys cheap properties, hoards Shells
- **Trader:** Frequent trade offers, focuses on completing color groups
- **Random:** Random decisions (for testing)

### 4.3 OpenClaw Integration (Future)

- Full game state sent to agent each turn as context
- Agent returns decisions in JSON
- Rate limiting and timeout required

---

## 5. UI/UX

### 5.1 Layout

```
+-----------------------------------------------------+
|  CLAWPOLY — Agent Monopoly               [Settings]  |
+-----------------------------------------------------+
|                                                       |
|  +-----------------------------------------------+   |
|  |                                               |   |
|  |              GAME BOARD                       |   |
|  |        (Classic Monopoly layout)              |   |
|  |        4 edges + center logo                  |   |
|  |                                               |   |
|  +-----------------------------------------------+   |
|                                                       |
|  +---------------------+  +------------------------+ |
|  | AGENT PANEL          |  | GAME LOG               | |
|  | - Lobster: $1200     |  | Turn 15: Lobster → 7   | |
|  | - Crab: $800         |  | Lobster buys Ningaloo   | |
|  | - Octopus: $1500     |  | Turn 16: Crab → 11     | |
|  | - Shark: $600        |  | Crab pays $22 rent      | |
|  +---------------------+  +------------------------+ |
+-----------------------------------------------------+
```

### 5.2 Board
- Classic Monopoly ring layout (see game.jpg)
- Each square: name, color strip, price, owner indicator
- Agent tokens visible (distinct colors)
- Outpost/Fortress icons on properties
- Mortgaged properties dimmed/grayed
- Active agent's square highlighted

### 5.3 Agent Panel
- Name, token, color
- Shell balance
- Owned properties (color coded)
- Outpost/Fortress count
- Escape cards count
- Lobster Pot status
- Active turn indicator (animated)

### 5.4 Game Log
- Chronological event feed
- Dice rolls, purchases, rent, cards, trades, bankruptcies
- Color coded per agent
- Auto-scroll to latest

### 5.5 Controls
- **Speed:** Slow / Normal / Fast / Instant
- **Pause / Resume**
- **Next Turn** (step mode)
- **New Game**
- **Player Count** (2–6)

### 5.6 Animations
- Dice rolling
- Token movement (square by square)
- Shell transfers
- Building placement
- Card flip
- Bankruptcy effect

### 5.7 Responsive
- Desktop-first
- Minimum width: 1024px
- Board centered, panels below or beside

---

## 6. Data Structures

```
GameState {
  players: Player[]
  board: Square[]
  currentPlayerIndex: number
  turnNumber: number
  tideCards: Card[]
  treasureChestCards: Card[]
  gamePhase: 'setup' | 'playing' | 'finished'
  gameSpeed: 'slow' | 'normal' | 'fast' | 'instant'
  winner: Player | null
}

Player {
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
  strategy: 'aggressive' | 'conservative' | 'trader' | 'random'
}

Square {
  index: number
  name: string
  type: 'property' | 'current' | 'utility' | 'tax' | 'tide_card' | 'treasure_chest' | 'special'
  colorGroup: string | null
  price: number | null
  rent: number[]  // [base, 1outpost, 2outpost, 3outpost, 4outpost, fortress]
  outpostCost: number | null
  fortressCost: number | null
  owner: string | null
  outposts: number  // 0–4
  fortress: boolean
  mortgaged: boolean
  mortgageValue: number | null
}
```

---

## 7. Decisions (Finalized)

- [x] Tech stack → Node.js/Express/TypeScript (server) + Next.js (frontend) + Redis + MongoDB
- [x] Player count → Fixed 4 agents per game
- [x] Agent system → Mock agents first (rule-based), OpenClaw integration later
- [x] Trade system → v2 (not in v1)
- [x] Sound/music → Yes (ocean ambiance, dice, buy/sell effects)
- [x] Save/load → v2 (replay system covers review needs)
- [x] Turn limit → 200 turns (wealthiest agent wins if reached)
