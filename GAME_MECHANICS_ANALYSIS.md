# Clawpoly — Game Mechanics & Algorithm Analysis

Comprehensive technical breakdown of all game mechanics, algorithms, formulas, and balance considerations based on the full engine source code.

---

## 1. Dice & Movement

### 1.1 Dice Roll Algorithm

**File:** `server/src/engine/dice.ts:3-12`

```typescript
const die1 = Math.floor(Math.random() * 6) + 1;
const die2 = Math.floor(Math.random() * 6) + 1;
```

- **Two standard 6-sided dice**, each independently uniform via `Math.random()`.
- **No loaded/weighted mechanics.** Pure uniform distribution.
- Output range: 2–12. Expected value per roll: **7.0**.
- Probability distribution follows the classic 2d6 bell curve (7 is most likely at 16.67%, 2 and 12 least likely at 2.78%).

### 1.2 Movement Calculation

**File:** `server/src/engine/gameEngine.ts:170-174`

```typescript
const newPos = (player.position + roll.total) % 40;
const passedSetSail = newPos < oldPos && newPos !== 0;
```

- **Modular arithmetic:** `(position + total) % 40` on a 40-square board.
- **Set Sail detection:** Triggered when `newPos < oldPos` (wrapped around) OR when `oldPos !== 0 && newPos === 0` (landed exactly on Set Sail).
- Set Sail bonus: flat **200 Shells** every time (`gameEngine.ts:601-604`).

### 1.3 Doubles Mechanic

**File:** `server/src/engine/gameEngine.ts:157-167`

- Rolling doubles grants another roll within the same turn.
- A counter `consecutiveDoubles` tracks sequential doubles.
- **3 consecutive doubles = sent to Lobster Pot** immediately, no movement on the 3rd roll.
- The counter resets to 0 at the start of each turn (`gameEngine.ts:144`) and on any non-double roll (`gameEngine.ts:160`).
- **Probability of triple doubles:** (1/6)^3 = **0.46%** per turn.

### 1.4 Turn Order Determination

**File:** `server/src/engine/turnOrder.ts:8-57`

- Each player rolls **a single die** (uses `rollDice().dice[0]`, so one d6).
- Sorted descending — highest roll goes first.
- **Ties resolved recursively:** tied players re-roll among themselves until resolved.
- The `resolveOrder()` function groups by roll value and recurses on tied groups.

### 1.5 Balance Note — Movement

The average number of turns to complete one board lap = 40 / 7 = **~5.7 turns**. Players pass Set Sail roughly every 5-6 turns, earning 200 Shells each time. This matches standard Monopoly economics.

---

## 2. Property Purchase & Pricing

### 2.1 Pricing Model

**File:** `server/src/engine/board.ts:15-63`

All prices are **static**, hard-coded in the `BOARD_DATA` array. There is **no dynamic pricing, auction system, or inflation mechanic**.

| Color Group | Properties | Prices | Total Group Cost |
|---|---|---|---|
| Sandy Shore | 2 | $60, $60 | $120 |
| Coastal Waters | 3 | $100, $100, $120 | $320 |
| Coral Gardens | 3 | $140, $140, $160 | $440 |
| Tropical Seas | 3 | $180, $180, $200 | $560 |
| Volcanic Depths | 3 | $220, $220, $240 | $680 |
| Sunlit Expanse | 3 | $260, $260, $280 | $800 |
| The Deep | 3 | $300, $300, $320 | $920 |
| Emperor's Realm | 2 | $350, $400 | $750 |
| Ocean Currents | 4 | $200 each | $800 |
| Utilities | 2 | $150 each | $300 |

**Total property value on board: $5,690**

### 2.2 Purchase Flow

**File:** `server/src/engine/gameEngine.ts:550-571`

```typescript
private async offerBuy(player: Player, square: Square): Promise<void> {
  if (!square.price || player.money < square.price) return;
  const agent = this.getAgent(player.id);
  const wantsToBuy = await agent.decideBuy(player, square, this.state);
  // ...
}
```

- Agent is offered the buy decision only if `player.money >= square.price`.
- If the agent declines, the property **stays unowned** — there is **no auction**.
- This is a significant deviation from standard Monopoly where declined properties go to auction.

### 2.3 Mortgage System

**File:** `server/src/engine/board.ts` (mortgage values in data), `server/src/engine/bankruptcy.ts:89-97`

- Mortgage value = **half the purchase price** (encoded per-square in `mortgageValue`).
- Unmortgage cost = mortgage value + 10% interest (defined in CLAUDE.md, not yet implemented as a standalone action — only used during bankruptcy auto-mortgage).
- No rent can be collected on mortgaged properties (`rent.ts:11`).

---

## 3. Rent Calculation

### 3.1 Property Rent

**File:** `server/src/engine/rent.ts:26-31`

```typescript
function calculatePropertyRent(square: Square, board: Square[]): number {
  if (square.fortress) return square.rent[5];
  if (square.outposts > 0) return square.rent[square.outposts];
  if (ownsFullColorGroup(square, board)) return square.rent[0] * 2;
  return square.rent[0];
}
```

**Rent escalation formula (priority order):**
1. **Fortress** → `rent[5]` (highest tier)
2. **Outposts** → `rent[outpostCount]` where index 1-4
3. **Monopoly (full color group, no buildings)** → `rent[0] * 2`
4. **Base rent** → `rent[0]`

**Rent escalation examples (Claw Emperor's Domain, the most expensive):**

| State | Rent | Multiplier vs Base |
|---|---|---|
| Base | $50 | 1x |
| Monopoly bonus | $100 | 2x |
| 1 Outpost | $200 | 4x |
| 2 Outposts | $600 | 12x |
| 3 Outposts | $1,400 | 28x |
| 4 Outposts | $1,700 | 34x |
| Fortress | $2,000 | 40x |

### 3.2 Ocean Current (Railroad) Rent

**File:** `server/src/engine/rent.ts:33-37`

```typescript
function calculateCurrentRent(square: Square, board: Square[]): number {
  const count = countCurrentsOwned(square.owner!, board);
  return square.rent[count - 1];  // rent = [25, 50, 100, 200]
}
```

| Currents Owned | Toll |
|---|---|
| 1 | $25 |
| 2 | $50 |
| 3 | $100 |
| 4 | $200 |

Exponential doubling pattern. Owning all 4 currents ($800 investment) yields $200/landing.

### 3.3 Utility Rent

**File:** `server/src/engine/rent.ts:39-44`

```typescript
function calculateUtilityRent(square: Square, board: Square[], diceTotal: number): number {
  const count = countUtilitiesOwned(square.owner!, board);
  if (count === 1) return diceTotal * 4;
  if (count === 2) return diceTotal * 10;
  return 0;
}
```

- **1 utility owned:** dice total x 4. Expected rent = 7 x 4 = **$28** average.
- **2 utilities owned:** dice total x 10. Expected rent = 7 x 10 = **$70** average.
- Range: $8–$48 (1 owned), $20–$120 (2 owned).

### 3.4 Rent Multipliers from Cards

**File:** `server/src/engine/gameEngine.ts:302-317, 319-334`

When a card sends a player to a Current or Utility, the engine applies special multipliers:
- **"Drift to nearest Current"** cards (Tide #5, #6): Pay **2x the normal toll** (`cardExecutor.ts:68`).
- **"Swim to nearest Utility"** card (Tide #7): Roll fresh dice and pay **10x dice total** (`cardExecutor.ts:77-81`), overriding the normal 4x/10x formula.

### 3.5 No Rent on Mortgaged Properties

**File:** `server/src/engine/rent.ts:11`

```typescript
if (square.mortgaged) return 0;
```

First check in `calculateRent()` — mortgaged properties always return 0.

---

## 4. Money Flow

### 4.1 Starting Balance

**Per CLAUDE.md:** Each agent starts with **1,500 Shells**.
**Total money in a 4-player game:** 6,000 Shells.

### 4.2 Money Inflows (Sources)

| Source | Amount | Frequency |
|---|---|---|
| Set Sail bonus | $200 | Every ~5.7 turns |
| Treasure Chest: "Sunken treasure" | $200 | 1/16 chance per draw |
| Treasure Chest: Collect cards | $10–$100 | Various (see Section 6) |
| Tide Card: Collect cards | $50–$150 | Various (see Section 6) |
| Collect-from-each cards | $10/player | 1/16 Treasure Chest |
| Rent income | Variable | When opponents land on your properties |

**Average income per lap (non-rent):** ~$200 (Set Sail) + card income ≈ **$230–$260/lap**.

### 4.3 Money Outflows (Sinks)

| Sink | Amount | Frequency |
|---|---|---|
| Fishing Tax (pos 4) | $200 | Land on square |
| Pearl Tax (pos 38) | $100 | Land on square |
| Property purchases | $60–$400 | Agent decision |
| Building costs | $100–$1,500 | Agent decision |
| Rent payments | Variable | Land on owned property |
| Lobster Pot escape fee | $50 | Per escape attempt |
| Card payments | $15–$150 | Various (see Section 6) |
| Pay-per-building cards | $25–$40/outpost, $100–$115/fortress | 2/32 total cards |
| Pay-each cards | $50/player | 1/16 Tide |

### 4.4 Tax Implementation

**File:** `server/src/engine/gameEngine.ts:366-373`

```typescript
const amount = square.index === 4 ? 200 : 100;
```

Hard-coded by position index. Tax payments go to the bank (null creditor), acting as a pure money sink.

### 4.5 Money Conservation

The game is **not zero-sum.** Money is created (Set Sail bonus, bank card payouts) and destroyed (taxes, bank card payments). The Set Sail bonus is the primary inflation driver at $200/lap/player, while taxes and building costs are the primary deflation mechanisms.

---

## 5. Building System

### 5.1 Building Costs

**File:** `server/src/types/square.ts:24-33` and `server/src/engine/board.ts`

| Color Group | Outpost Cost | Fortress Cost | Max Investment (3-prop group) |
|---|---|---|---|
| Sandy Shore | $100 | $500 | 2 x (4 x $100 + $500) = $1,800 |
| Coastal Waters | $100 | $500 | 3 x (4 x $100 + $500) = $2,700 |
| Coral Gardens | $150 | $750 | 3 x (4 x $150 + $750) = $4,050 |
| Tropical Seas | $150 | $750 | 3 x (4 x $150 + $750) = $4,050 |
| Volcanic Depths | $200 | $1,000 | 3 x (4 x $200 + $1,000) = $5,400 |
| Sunlit Expanse | $200 | $1,000 | 3 x (4 x $200 + $1,000) = $5,400 |
| The Deep | $300 | $1,500 | 3 x (4 x $300 + $1,500) = $8,100 |
| Emperor's Realm | $300 | $1,500 | 2 x (4 x $300 + $1,500) = $5,400 |

### 5.2 Building Rules & Restrictions

**File:** `server/src/engine/building.ts:4-21`

The `canBuild()` function enforces these checks (in order):
1. Must be a `property` type square
2. Must be owned by the requesting player
3. Must NOT be mortgaged
4. Must NOT already have a fortress
5. Must have < 4 outposts
6. Must have a valid `outpostCost`
7. Must own the **entire color group**
8. **No mortgaged properties** anywhere in the color group (`building.ts:125-127`)
9. **Even building rule** (`building.ts:16-18`): Cannot build if this property has more outposts than the minimum in its group

### 5.3 Fortress Upgrade Rules

**File:** `server/src/engine/building.ts:28-41`

```typescript
export function canUpgradeToFortress(squareIndex, board, playerId): boolean {
  // ... standard checks ...
  if (square.outposts !== 4) return false;
  // Even fortress rule: all siblings must also have 4 outposts or a fortress
  const siblings = getGroupSquares(square, board).filter((s) => s.index !== squareIndex);
  return siblings.every((s) => s.outposts === 4 || s.fortress);
}
```

- Requires exactly **4 outposts** on the target property.
- All sibling properties must have 4 outposts or already have a fortress.
- On upgrade: outposts set to 0, fortress set to true, player pays `fortressCost`.

### 5.4 Building Sale (Liquidation)

**File:** `server/src/engine/building.ts:73-98`

```typescript
export function getBuildingSellValue(square: Square): number {
  if (square.fortress && square.fortressCost) return Math.floor(square.fortressCost / 2);
  if (square.outposts > 0 && square.outpostCost) return Math.floor(square.outpostCost / 2);
  return 0;
}
```

- Sell value = **half the build cost** (floored).
- **Critical behavior:** When selling a fortress, outposts are **NOT restored** (`building.ts:79`). The property goes directly from fortress → empty. This means selling a fortress loses the value of 4 outposts that were consumed during the upgrade.

### 5.5 No Building Supply Limit

Per CLAUDE.md: "No bank limit on Outposts or Fortresses — unlimited supply." This removes the strategic element of building scarcity present in classic Monopoly.

### 5.6 Building Phase

**File:** `server/src/engine/gameEngine.ts:510-546`

- Occurs at the end of every turn (after square action), provided the player is not bankrupt and not in Lobster Pot.
- Agent can build/upgrade **multiple times** in a single building phase (looped with a safety limit of **50 iterations**).
- Each iteration re-evaluates which properties are buildable/upgradeable.

---

## 6. Card System

### 6.1 Deck Structure

**File:** `server/src/engine/cards.ts`

Two decks of **16 cards each** (32 total cards).

### 6.2 Shuffle Algorithm

**File:** `server/src/engine/cards.ts:11-17`

```typescript
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
```

**Fisher-Yates shuffle** — correct, unbiased, O(n). Each permutation is equally likely.

### 6.3 Draw Mechanics

**File:** `server/src/engine/gameEngine.ts:375-390`

```typescript
const card = deck.shift()!;  // Draw from top
deck.push(card);              // Return to bottom
```

Cards cycle through the deck. Once all 16 are drawn, the same sequence repeats. The deck is only shuffled at game initialization.

**Important:** When a card moves a player to a card square, the engine does **not** recursively draw another card (`gameEngine.ts:443` — explicit return to prevent recursion).

### 6.4 Tide Card Breakdown (16 cards)

| ID | Action | Effect | Net EV (Shells) |
|---|---|---|---|
| 1 | `move_to` | Move to pos 39 (Emperor's Domain) | Variable (may owe rent) |
| 2 | `move_to_collect` | Move to Set Sail, collect $200 | +$200 |
| 3 | `move_to_collect` | Move to Dragon Eel Caverns (pos 24), +$200 if pass Set Sail | Variable |
| 4 | `move_to_collect` | Move to Raja Ampat Gardens (pos 11), +$200 if pass Set Sail | Variable |
| 5 | `move_nearest_current` | Nearest Current, pay **2x toll** | Variable (negative if owned) |
| 6 | `move_nearest_current` | Nearest Current, pay **2x toll** (duplicate) | Variable (negative if owned) |
| 7 | `move_nearest_utility` | Nearest Utility, roll dice, pay **10x** | Variable (negative if owned) |
| 8 | `collect` | Collect $50 | +$50 |
| 9 | `escape_lobster_pot` | Escape card | Strategic value |
| 10 | `move_back` | Move back 3 spaces | Variable |
| 11 | `go_to_lobster_pot` | Go to Lobster Pot | Negative (lose turns) |
| 12 | `pay_per_building` | $25/outpost, $100/fortress | -$25 to -$2,000+ |
| 13 | `pay` | Pay $15 | -$15 |
| 14 | `move_to_collect` | Move to Poseidon's Current (pos 5), +$200 if pass Set Sail | Variable |
| 15 | `pay_each` | Pay each player $50 | -$150 (in 4-player) |
| 16 | `collect` | Collect $150 | +$150 |

**Tide Card EV Distribution:**
- Pure positive: 3 cards (#2, #8, #16) = 18.75%
- Pure negative: 4 cards (#11, #12, #13, #15) = 25%
- Movement (variable): 7 cards = 43.75%
- Escape card: 1 card = 6.25%
- Duplicate: 1 pair (#5/#6) = 12.5%

### 6.5 Treasure Chest Card Breakdown (16 cards)

| ID | Action | Effect | Net EV (Shells) |
|---|---|---|---|
| 1 | `move_to_collect` | Move to Set Sail, collect $200 | +$200 |
| 2 | `collect` | Collect $200 | +$200 |
| 3 | `pay` | Pay $50 | -$50 |
| 4 | `collect` | Collect $50 | +$50 |
| 5 | `escape_lobster_pot` | Escape card | Strategic value |
| 6 | `go_to_lobster_pot` | Go to Lobster Pot | Negative |
| 7 | `collect` | Collect $100 | +$100 |
| 8 | `collect` | Collect $20 | +$20 |
| 9 | `collect_from_each` | Collect $10 from each player | +$30 (in 4-player) |
| 10 | `collect` | Collect $100 | +$100 |
| 11 | `pay` | Pay $100 | -$100 |
| 12 | `pay` | Pay $50 | -$50 |
| 13 | `collect` | Collect $25 | +$25 |
| 14 | `pay_per_building` | $40/outpost, $115/fortress | Variable negative |
| 15 | `collect` | Collect $10 | +$10 |
| 16 | `collect` | Collect $100 | +$100 |

**Treasure Chest EV (excluding variable cards):**
- Pure positive: 9 cards = 56.25% (total: +$835 across all)
- Pure negative: 3 cards = 18.75% (total: -$200 across all)
- Variable negative: 1 card (#14, building assessment)
- Escape card: 1 card
- Movement (to Lobster Pot): 1 card
- Movement (positive, to Set Sail): 1 card

**Key Insight:** Treasure Chest is significantly more generous than Tide Cards. The expected value of a Treasure Chest draw (excluding movement/building cards) is approximately **+$40** while Tide Cards have a slightly negative EV.

### 6.6 Card Square Positions

| Type | Positions | Board Section |
|---|---|---|
| Treasure Chest | 2, 17, 33 | Bottom, Left, Right |
| Tide Card | 7, 22, 36 | Bottom, Top, Right |

6 card squares total out of 40 = **15% landing probability** per lap.

---

## 7. Bankruptcy & Elimination

### 7.1 Bankruptcy Resolution

**File:** `server/src/engine/bankruptcy.ts:10-48`

The `resolveBankruptcy()` function follows a strict 3-step waterfall:

```
Step 1: Sell ALL buildings (at half cost)
    ↓ (still can't pay?)
Step 2: Mortgage ALL properties
    ↓ (still can't pay?)
Step 3: Declare bankruptcy
```

### 7.2 Automatic Liquidation

**File:** `server/src/engine/bankruptcy.ts:74-87`

```typescript
function sellAllBuildings(player: Player, board: Square[]): void {
  let hasMore = true;
  while (hasMore) {
    hasMore = false;
    for (const propIndex of player.properties) {
      if (square.fortress || square.outposts > 0) {
        sellBuilding(propIndex, board, player);
        hasMore = true;
      }
    }
  }
}
```

Buildings are sold iteratively until none remain. This is **fully automatic** — the agent has no control over which buildings to sell first or when to stop.

### 7.3 Asset Transfer on Bankruptcy

**File:** `server/src/engine/bankruptcy.ts:99-128`

**If debt is to another player (`creditorId` is not null):**
- All remaining cash transfers to creditor
- All escape cards transfer to creditor
- All properties transfer to creditor (ownership change on board)
- Properties retain their **mortgaged state** — creditor receives mortgaged properties

**If debt is to the bank (`creditorId` is null):**
- Cash set to 0
- Escape cards set to 0
- All properties become **unowned**, unmortgaged, with 0 outposts and no fortress

### 7.4 Net Worth Calculation

**File:** `server/src/engine/bankruptcy.ts:50-72`

```typescript
export function calculateNetWorth(player: Player, board: Square[]): number {
  let worth = player.money;
  for (const propIndex of player.properties) {
    const square = board[propIndex];
    if (square.mortgaged) {
      worth += square.mortgageValue || 0;
    } else {
      worth += square.price || 0;    // Full purchase price
    }
    // Building values at half cost
    worth += getBuildingSellValue(square);
    if (square.outposts > 0 && square.outpostCost) {
      worth += Math.floor(square.outpostCost / 2) * (square.outposts - 1);
    }
  }
  return worth;
}
```

**Components:**
- Cash on hand
- Unmortgaged properties at **full purchase price**
- Mortgaged properties at **mortgage value** (half price)
- Buildings at **half build cost** (sell value)

**Note:** There's a subtle implementation detail — `getBuildingSellValue()` returns the value for either the fortress OR one outpost. For multiple outposts, the code adds `(outposts - 1)` more outpost values. This correctly totals all outpost values.

---

## 8. Win Condition

### 8.1 Game End Detection

**File:** `server/src/engine/gameEngine.ts:608-626`

```typescript
private checkGameEnd(): boolean {
  const activePlayers = this.getActivePlayers();
  // Last player standing
  if (activePlayers.length <= 1) { ... }
  // Turn limit
  if (this.state.turnLimit && this.state.turnNumber >= this.state.turnLimit) { ... }
  return false;
}
```

**Two end conditions (checked after every turn):**

1. **Last Agent Standing:** All other agents are bankrupt. The sole survivor wins.
2. **Turn Limit:** When `turnNumber >= turnLimit` (default 200), the wealthiest agent wins based on `calculateNetWorth()`.

### 8.2 Winner Determination

- Last-standing: the single remaining active player.
- Turn limit: `determineWealthiestPlayer()` iterates all active players and returns the one with highest net worth (`gameEngine.ts:628-641`).
- Final standings are sorted by net worth descending and emitted with the `game:finished` event.

### 8.3 Edge Case — Tie

There is **no tie-breaking logic** in `determineWealthiestPlayer()`. If two players have identical net worth, the first one found in the player array wins (deterministic but arbitrary based on initial ordering).

---

## 9. Agent Decision Points

### 9.1 Decision Interface

**File:** `server/src/types/agent.ts:10-28`

Agents must implement three decision methods:

| Method | When Called | Options | Timeout Fallback |
|---|---|---|---|
| `decideBuy()` | Land on unowned property | `true` (buy) / `false` (pass) | Auto-pass |
| `decideBuild()` | End of turn, if buildable properties exist | `BuildDecision` or `null` (skip) | Auto-skip |
| `decideLobsterPot()` | Start of turn while in Lobster Pot | `'pay'` / `'card'` / `'roll'` | Auto-roll |

### 9.2 Information Available to Agents

Each decision method receives:
- **`player`**: Full Player state (money, position, properties, escape cards, etc.)
- **`state`**: Full GameState (all players, entire board, card decks, turn number, phase)
- **`square`** (buy only): The specific property being offered
- **`buildableSquares` / `upgradeableSquares`** (build only): Pre-filtered valid indices

Agents have **perfect information** — they can see every other player's money, properties, buildings, and position.

### 9.3 Missing Agent Decision Points

The following decisions are **automated** (no agent input):
- **Dice rolling:** Automatic, agents cannot choose when to roll.
- **Selling buildings during bankruptcy:** Fully automatic, sells all buildings then mortgages all properties.
- **Which buildings to sell:** No choice — all are sold.
- **Mortgage/unmortgage:** Only happens automatically during bankruptcy. No voluntary mortgage action.
- **Trade offers:** Not implemented (v2 feature, `trade.ts` is a stub).

### 9.4 Agent Timeout Configuration

**File:** `server/src/config.ts:9-10`

```typescript
agentTimeoutMs: parseInt(process.env.AGENT_TIMEOUT_MS || '30000', 10),      // 30s
agentDisconnectGraceMs: parseInt(process.env.AGENT_DISCONNECT_GRACE_MS || '60000', 10), // 60s
```

- Decision timeout: **30 seconds** (configurable via env).
- Disconnect grace period: **60 seconds**.
- `consecutiveTimeouts` is tracked on the Player object but the 5-timeout-to-bankrupt rule is not yet enforced in the engine.

### 9.5 Random Agent (Reference Implementation)

**File:** `server/src/engine/agents/randomAgent.ts`

| Decision | Strategy |
|---|---|
| Buy | **70% chance** to buy (if affordable) |
| Build | **50% chance** to skip; otherwise upgrades first, then builds |
| Lobster Pot | 50% chance to use card (if available), 50% chance to pay (if affordable), otherwise roll |

---

## 10. Luck vs Strategy Balance Assessment

### 10.1 Luck Factors

| Factor | Impact | Notes |
|---|---|---|
| Dice rolls | **Very High** | Determines where you land, what you pay, who benefits |
| Card draws | **High** | 32 cards with effects ranging from +$200 to Lobster Pot |
| Turn order | **Medium** | First mover advantage for property acquisition |
| Opponent landing patterns | **High** | Rent income entirely depends on opponents' dice |

### 10.2 Strategy Factors

| Factor | Impact | Notes |
|---|---|---|
| Buy decisions | **High** | Which properties to acquire |
| Build timing | **High** | When to invest in outposts/fortresses |
| Lobster Pot escape | **Low** | Minor optimization (pay $50 vs risk turns) |
| Cash reserves | **Medium** | Balance between building and keeping liquidity |

### 10.3 Overall Assessment

**Luck/Strategy Ratio: ~70/30** (heavily luck-dependent)

The game is more luck-driven than standard Monopoly because:
1. **No auctions** — if a player passes, no one else can bid. This removes a key strategic interaction.
2. **No trades** (v2) — the primary strategic lever in Monopoly is completely absent.
3. **No voluntary mortgage** — agents can't strategically leverage mortgages.
4. **Automatic bankruptcy liquidation** — agents can't choose which buildings to sell first.
5. **Perfect information** — all agents see everything, reducing information asymmetry as a strategic axis.

### 10.4 Specific Balance Concerns

#### CONCERN 1: No Auction System
When a player passes on a property, it simply stays unowned. In standard Monopoly, declined properties go to auction, ensuring properties enter the game faster and creating a strategic bidding dynamic. Without auctions, properties may remain unowned indefinitely, slowing the game.

#### CONCERN 2: Fortress Sell Penalty
**File:** `building.ts:78-79` — When selling a fortress, outposts are NOT restored. This means a fortress that cost $500 + 4 x $100 = $900 total only returns $250 (half fortress cost). The effective loss is $650 vs the $450 loss for 4 individual outposts ($200 total sell value). This heavily penalizes fortress building for risk-averse strategies.

#### CONCERN 3: Treasure Chest vs Tide Card Imbalance
Treasure Chest cards are significantly more favorable (+$835 total positive, -$200 total negative) compared to Tide Cards which have more movement risk and the punishing "pay each player $50" card. Players landing on Treasure Chest squares (positions 2, 17, 33) have a measurable advantage.

#### CONCERN 4: Emperor's Realm ROI
Emperor's Realm (2 properties, $750 total) with full fortress development costs $750 + 2 x ($1,200 outposts + $1,500 fortress) = $6,150 total. Max rent is $2,000 per landing. With ~2.5% chance of any given player landing on a specific square per turn, and 3 opponents, expected income is ~$150/turn. Payback period: ~41 turns. Compare to Sandy Shore: $120 + 2 x ($400 + $500) = $1,920 total, max rent $250+$450=$700 per landing pair. Much faster ROI despite lower peak rent.

#### CONCERN 5: No Building Scarcity
Unlimited outpost/fortress supply removes the strategic "building shortage" that creates tension in classic Monopoly. In the original game, deliberately holding buildings to deny them to opponents is a valid strategy.

#### CONCERN 6: Turn Limit Net Worth Calculation
Unmortgaged properties count at full purchase price in net worth, while mortgaged properties count at half. This means an agent who buys a $400 property gains $400 net worth (minus $400 cash = net zero), but if forced to mortgage it later, their net worth drops by $200. This creates a slight incentive to avoid mortgaging near the turn limit.

#### CONCERN 7: collectFromEach Bankruptcy Handling
**File:** `gameEngine.ts:458-471` — When a player collects from each and an opponent can't fully pay, the code directly sets `other.money = 0` and calls `resolveBankruptcy()` for the remaining amount. However, it only adds `canPay` (the cash the opponent had) rather than potentially getting more from the bankruptcy resolution's building sales. The bankrupt player's assets transfer, but the collecting player may receive less than owed.

#### CONCERN 8: Lobster Pot Escape Order
**File:** `gameEngine.ts:199-253` — If an agent requests `'card'` but has no cards, or `'pay'` but has insufficient funds, the code falls through to rolling dice. This is sensible fallback behavior but the agent isn't notified that their preferred action was denied.

#### CONCERN 9: Set Sail Landing vs Passing
**File:** `gameEngine.ts:182` — The condition `passedSetSail || (oldPos !== 0 && newPos === 0)` correctly handles both passing and landing on Set Sail. However, `move_to_collect` in card executor uses `pos <= player.position && pos !== player.position` (`cardExecutor.ts:53`) which simplifies to `pos < player.position`. Landing on Set Sail via the "Sail to Set Sail" card gives +$200 via the card's collect field, not via the Set Sail detection, which is correct since `move_to_collect` to position 0 would have `passedSetSail = false` (0 < position but `pos !== player.position` would be true only if player isn't already at 0).

#### CONCERN 10: Speed Configuration Mismatch
**File:** `config.ts:17-23` — The speed settings use `very_slow: 2000, slow: 1000, normal: 500, fast: 250, instant: 0` but CLAUDE.md specifies different values (`slow: 2000/3000, normal: 800/1500, fast: 200/500, instant: 0/0`). The implementation also has a `very_slow` option not in the design doc and doesn't differentiate between "between events" and "between turns" delays — there's a single `delayMs` used uniformly.

---

## Appendix A: Complete Property Data Reference

| Pos | Name | Price | Mortgage | Base Rent | 1 Out | 2 Out | 3 Out | 4 Out | Fort | Out$ | Fort$ |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Tidal Pool Flats | $60 | $30 | $2 | $10 | $30 | $90 | $160 | $250 | $100 | $500 |
| 3 | Mangrove Shallows | $60 | $30 | $4 | $20 | $60 | $180 | $320 | $450 | $100 | $500 |
| 6 | Ningaloo Reef | $100 | $50 | $6 | $30 | $90 | $270 | $400 | $550 | $100 | $500 |
| 8 | Red Sea Reef | $100 | $50 | $6 | $30 | $90 | $270 | $400 | $550 | $100 | $500 |
| 9 | Belize Barrier Reef | $120 | $60 | $8 | $40 | $100 | $300 | $450 | $600 | $100 | $500 |
| 11 | Raja Ampat Gardens | $140 | $70 | $10 | $50 | $150 | $450 | $625 | $750 | $150 | $750 |
| 13 | Coral Triangle | $140 | $70 | $10 | $50 | $150 | $450 | $625 | $750 | $150 | $750 |
| 14 | Tubbataha Reef | $160 | $80 | $12 | $60 | $180 | $500 | $700 | $900 | $150 | $750 |
| 16 | Maldives Atolls | $180 | $90 | $14 | $70 | $200 | $550 | $750 | $950 | $150 | $750 |
| 18 | Seychelles Bank | $180 | $90 | $14 | $70 | $200 | $550 | $750 | $950 | $150 | $750 |
| 19 | Galapagos Reserve | $200 | $100 | $16 | $80 | $220 | $600 | $800 | $1000 | $150 | $750 |
| 21 | Hydrothermal Vents | $220 | $110 | $18 | $90 | $250 | $700 | $875 | $1050 | $200 | $1000 |
| 23 | Volcanic Abyss | $220 | $110 | $18 | $90 | $250 | $700 | $875 | $1050 | $200 | $1000 |
| 24 | Dragon Eel Caverns | $240 | $120 | $20 | $100 | $300 | $750 | $925 | $1100 | $200 | $1000 |
| 26 | Sargasso Sea | $260 | $130 | $22 | $110 | $330 | $800 | $975 | $1150 | $200 | $1000 |
| 27 | Palau Sanctuary | $260 | $130 | $22 | $110 | $330 | $800 | $975 | $1150 | $200 | $1000 |
| 29 | Chagos Archipelago | $280 | $140 | $24 | $120 | $360 | $850 | $1025 | $1200 | $200 | $1000 |
| 31 | Abyssal Kraken's Lair | $300 | $150 | $26 | $130 | $390 | $900 | $1100 | $1275 | $300 | $1500 |
| 32 | Serpent's Trench | $300 | $150 | $26 | $130 | $390 | $900 | $1100 | $1275 | $300 | $1500 |
| 34 | The Sunken Citadel | $320 | $160 | $28 | $150 | $450 | $1000 | $1200 | $1400 | $300 | $1500 |
| 37 | Leviathan's Throne | $350 | $175 | $35 | $175 | $500 | $1100 | $1300 | $1500 | $300 | $1500 |
| 39 | Claw Emperor's Domain | $400 | $200 | $50 | $200 | $600 | $1400 | $1700 | $2000 | $300 | $1500 |

## Appendix B: Money Flow Diagram

```
                    +-------------------+
                    |    BANK (∞)       |
                    +-------------------+
                      ↑↑           ↓↓
        Taxes ($100-200)  |   Set Sail Bonus ($200)
        Building costs    |   Card collect payouts
        Card pay costs    |   Property mortgage loans
        Lobster Pot fee   |
                      ↑↑           ↓↓
                    +-------------------+
                    |   PLAYER AGENTS   |
                    +-------------------+
                      ↕↕ ← Rent, card transfers, collect-from-each, pay-each
```

## Appendix C: File Index

| File | Lines | Purpose |
|---|---|---|
| `server/src/config.ts` | 24 | Server config, speed delays |
| `server/src/engine/dice.ts` | 13 | Dice rolling (2d6) |
| `server/src/engine/board.ts` | 63 | Board data (40 squares) |
| `server/src/engine/cards.ts` | 56 | Card definitions (32 cards) |
| `server/src/engine/cardExecutor.ts` | 149 | Card effect execution |
| `server/src/engine/rent.ts` | 61 | Rent calculation formulas |
| `server/src/engine/building.ts` | 128 | Building rules and operations |
| `server/src/engine/bankruptcy.ts` | 129 | Bankruptcy resolution |
| `server/src/engine/trade.ts` | 10 | Trade stub (v2) |
| `server/src/engine/turnOrder.ts` | 58 | Initial turn order |
| `server/src/engine/gameEngine.ts` | 707 | Main game loop and orchestration |
| `server/src/engine/agents/randomAgent.ts` | 45 | Random strategy agent |
| `server/src/types/game.ts` | 46 | GameState, DiceRoll, GameEvent types |
| `server/src/types/player.ts` | 27 | Player type, token colors |
| `server/src/types/square.ts` | 50 | Square type, color groups, building costs |
| `server/src/types/cards.ts` | 24 | Card type definitions |
| `server/src/types/agent.ts` | 29 | Agent decision interface |
| `server/src/types/messages.ts` | 72 | WebSocket message types |
| `server/src/types/mongo.ts` | 68 | MongoDB document schemas |
