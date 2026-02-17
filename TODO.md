# Clawpoly — TODO List

Roadmap priority: **Mock Agents → Basic Gameplay Solid → AI Agents → Onchain**

---

## 🔴 Phase 1: Working Alpha (BLOCKER)

- [ ] **Redis + MongoDB setup** — Local dev environment
- [ ] **E2E testing** — Server start, mock agent connect, play full game

---

## 🟡 Phase 2: Gameplay Quality

### Missing Mechanics
- [ ] **Auction system** — When property is passed, start bidding (biggest strategic depth)
- [ ] **Voluntary trading phase** — Agent can initiate trades at turn start (not only if you land)
- [ ] **Building cooldowns** — Selling buildings should incur penalty/loss (currently no restriction)
- [ ] **Speed config mismatch** — `config.ts` vs design document mismatch

### Balance Adjustments
- [ ] **Treasure Chest vs Tide Card** — TC too strong (net +635), Tide too negative
- [ ] **Fortress sale cost** — Outpost return too expensive, overlook it for now
- [ ] **Building limit (optional)** — Should agents be limited on what they can build?

### Agent Development
- [ ] **SmartAgent** — Complete color groups, cash reserve management, ROI calculation
- [ ] **AggressiveAgent** — Buy everything, fast building strategy
- [ ] **ConservativeAgent** — Save money, buy only premium properties
- [ ] **Agent decision nodes expanded** — Which property to attack, when to upgrade, etc.

---

## 🟢 Phase 3: Frontend & Spectator Improvements

### Missing UI Components
- [ ] **DiceDisplay** — Dice rolling animation
- [ ] **BuildingMarkers** — Visual outpost/fortress on board
- [ ] **CardOverlay** — Drawn card display
- [ ] **AgentToken** — Show playing agent tokens on board
- [ ] **RollOrderView** — Starting order screen
- [ ] **GameOverOverlay** — Final rankings + statistics

### Spectator Features
- [ ] **Replay system** — Watch completed games
- [ ] **Delta-based state sync** — Send full state on every event instead of diff for bandwidth
- [ ] **Event mutation fix** — roomManager directly mutating event.data
- [ ] **Spectator speed control** — Allow viewers to adjust playback speed

---

## 🔵 Phase 4: AI Agent Integration

- [ ] **OpenClaw agent protocol** — WebSocket-based AI agent connection
- [ ] **LLM-based agent** — GPT/Claude powered decision making
- [ ] **Agent personality system** — Each agent gets unique strategy/personality
- [ ] **Agent vs Agent tournament mode** — Multiple games, ELO ranking
- [ ] **Agent timeout enforcement** — Track `consecutiveTimeouts`, apply 5-timeout-to-bankrupt rule
- [ ] **Voluntary mortgage/unmortgage** — Add mortgage/unmortgage as agent decision option (unmortgage = mortgageValue + 10% interest)

---

## 🟣 Phase 5: Premium & Onchain

- [ ] **Crypto entry fee** — Pay with SOL/ETH to join premium games
- [ ] **Prize pool management** — Entry fees → pool → distribute to winners
- [ ] **%10 platform commission** — Automatic fee deduction
- [ ] **Smart contract** — Payment logic, escrow pool, instant payouts
- [ ] **Anti-cheat** — Agent collusion detection, manipulation prevention

---

## 🛠️ Infrastructure & DevOps

- [ ] **Docker Compose** — Redis + MongoDB + Server + Client single command
- [ ] **CI/CD pipeline** — GitHub Actions for tests + deploy
- [ ] **TypeScript strict mode** — Tighten type safety
- [ ] **Test suite** — Engine unit tests (rent calc, bankruptcy, card executor)
- [ ] **Linting + formatting** — ESLint + Prettier standards

---

## ✅ Completed

- [x] Server Phase 1 (engine, room manager, WS, MongoDB persist)
- [x] Server-client contract fixes
- [x] Documentation improvements
- [x] Frontend Phase 2 (lobby, board, spectator UI)
- [x] Pause/resume fix
- [x] Delete room button
- [x] Game loop condition fix
- [x] Game mechanics analysis (GAME_MECHANICS_ANALYSIS.md)
- [x] Landing page (hero, features, how-it-works, Solana section, video, board preview, wishlist)
- [x] Login page (spectator/agent toggle, skill command, room code entry)
- [x] Wishlist API + MongoDB model
- [x] Mobile responsive layout
- [x] Speed selector (server-side integration)
- [x] Agent properties display in AgentCard
- [x] Token visibility improvements
- [x] MCP Server with agent registration, matchmaking queue
- [x] Claim page with agent stats
- [x] Mock agent queue filler
- [x] Spectator room page (live game viewing)
