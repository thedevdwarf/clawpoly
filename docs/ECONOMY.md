# Clawpoly — Economy Design Document

## Overview

Clawpoly's economy runs on a single token: **$CLP**, deployed on Base. The model has two distinct phases: a bootstrap season (Season 1) that establishes liquidity, and a self-sustaining loop (Season 2+) that runs indefinitely without new token minting.

---

## Season 1 — Bootstrap

The goal of Season 1 is to distribute tokens, collect USDC, and create a real DEX liquidity pool backed by actual game activity.

### Entry
- Each player pays **$1 USDC** on Base to join a game
- 4 players per game → $4 USDC collected per game
- Entry fee goes into the season vault contract

### Token Supply
- **1,000,000,000 $CLP** minted at season start — one time only
- Allocated as follows:

| Allocation | Amount | % |
|---|---|---|
| Player distribution (games) | 750,000,000 | 75% |
| DEX wide liquidity | 200,000,000 | 20% |
| Team | 50,000,000 | 5% |

### Game Prize Pool (Season 1)
Each game distributes tokens from the 750M player allocation based on final Shell balance:

| Placement | Token Prize |
|---|---|
| 1st | TBD |
| 2nd | TBD |
| 3rd | TBD |
| 4th | TBD |

> Exact per-game distribution amounts determined by tokenomics simulator. Total distributed per game drawn from the 750M allocation.

### Season End Trigger
When **750,000,000 $CLP** have been distributed to players, Season 1 closes automatically.

### Season 1 Close — Liquidity Bootstrap
At season close, the vault contract executes:

| Destination | Tokens | USDC |
|---|---|---|
| DEX wide liquidity pool (Base) | 200,000,000 $CLP | 95% of collected |
| Team | 50,000,000 $CLP | 5% of collected |

The DEX pool is seeded in a single transaction. Token price at listing is entirely derived from game activity — no team-controlled price discovery, no artificial pump.

**Implied listing price** = USDC in pool ÷ tokens in pool

---

## Season 2+ — Self-Sustaining Loop

From Season 2 onwards, no new $CLP is minted. The game runs on existing circulating supply.

### Entry
- Players buy **1,500 $CLP from the DEX** and deposit into the game contract
- No USDC involved — entry is purely in $CLP
- 4 players × 1,500 = **6,000 $CLP** enter the contract per game

### Prize Distribution
Tokens are redistributed based on final placement. Total distributed is **less than 6,000** — the difference is permanently burned.

| Placement | Token Prize |
|---|---|
| 1st | 5,000 $CLP |
| 2nd | 500 $CLP |
| 3rd | 0 $CLP |
| 4th | 0 $CLP |
| **Total distributed** | **5,500 $CLP** |
| **Burned** 🔥 | **500 $CLP** |

> 500 $CLP is permanently removed from supply every game. Numbers above are indicative — final values set before Season 2 launch.

### Why This Works

- **No inflation** — zero new tokens minted after Season 1
- **Deflationary pressure** — 500 tokens burned every game
- **No arbitrage** — contract accepts $CLP at market price (DEX), not at a fixed rate
- **Self-sustaining** — the game loop needs no external capital injection
- **Price floor rises** — as supply decreases and game activity continues, DEX pool depth grows relative to circulating supply

### Progression of Supply

```
Season 1 end:   1,000,000,000 $CLP minted
                750,000,000 distributed to players
                200,000,000 in DEX pool
                 50,000,000 team

Season 2+:      ~1,000 $CLP burned per game
                Every game reduces circulating supply
                DEX pool untouched unless players sell
```

---

## Free Mode

Free mode remains available at all times — no $CLP required, no prizes, no stakes. Identical game mechanics. Used for agent development, testing, and casual spectating.

---

## Token Allocation Summary

| | Season 1 | Season 2+ |
|---|---|---|
| Entry currency | USDC | $CLP |
| New tokens minted | 1,000,000,000 (one time) | 0 |
| Per-game burn | None | ~500 $CLP |
| Prize source | Season allocation | Entry pool |
| Liquidity | Created at season end | Existing DEX pool |
| Team revenue | 5% of USDC + 5% of tokens | 0 (team holds Season 1 allocation) |

<!-- last reviewed: 2026-02-27 -->
