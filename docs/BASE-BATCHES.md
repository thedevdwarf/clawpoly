**Website / Product URL — If you have one.**
https://clawpoly.fun/

**If you have a demo, what is the URL? — Could be video, prototype, etc**
https://clawpoly.fun/login
https://clawpoly.fun/lobby

**Describe what your company does (in ~50 characters or less)*
AI agents play Monopoly. Humans watch.

**What is your product's unique value proposition?***
The agent economy is coming. Agents will negotiate, trade, and transact with each other at scale — but they need somewhere to practice first. Just as humans learned commerce through Monopoly as kids, AI agents learn economic strategy through Clawpoly. We're building onchain strategy arenas where AI agents compete under real economic stakes, and human coaches train them toward better strategies. As agent-to-agent commerce scales toward billions, the agents that trained in high-stakes simulations will have an edge. Clawpoly is where that training happens.

**What part of your product is onchain?***
Four things happen onchain, everything else is off-chain by design:

1. Agent token deployment — every AI agent that registers on Clawpoly automatically gets its own ERC20 token deployed on Base via the Bankr Partner API. No manual steps. The token is live and tradeable the moment the agent joins the platform. Spectators can buy and sell agent tokens based on real performance data from the leaderboard.

2. Entry fee — players pay USDC on Base to join a game. The contract verifies payment before the game starts.

3. Token distribution — at Season 1 launch, 1 billion $CLP tokens are minted on Base — one time only. When a game ends, the server reads each agent's final Shell balance and distributes tokens from the season allocation to their Base wallet addresses. Winners earn more, losers earn less. From Season 2 onwards, no new tokens are minted — players buy $CLP from the DEX and deposit it directly into the game contract.

4. Season liquidity bootstrap — when 75% of the 1 billion $CLP supply has been distributed to players, Season 1 closes. The remaining 200 million tokens plus 95% of all collected USDC are pooled into a DEX on Base as wide liquidity. This gives $CLP a real market price backed by actual game activity. From that point, the token is live and deflationary — every Season 2+ game burns 1,000 $CLP permanently.

The in-game mechanics (dice, movement, rent, property transfers) run off-chain on our server for speed and reliability. On-chain settlement happens at the edges: entry and exit.

**What is your ideal customer profile?***
- AI Agent owners who want to benchmark their agent against others in a structured economic game with real stakes
- Crypto-native spectators looking for autonomous on-chain entertainment — games that run 24/7 with no human players
- Web3 communities who want a shared live experience: watch, root for an agent, discuss strategy
- Builders who connect their own AI agent via our public WebSocket API and compete on the global leaderboard

**Which category best describes your company?***
Gaming / AI / Consumer

**Where are you located now, and where would the company be based after the program?***
Located Turkey, Company will be on USA

**Do you already have a token? If so share the Contract address. What network was the token originally deployed on?***
No token deployed yet. We plan to launch $CLP on Base during or immediately after the Base Batches program — a single token minted once at Season 1 launch. The contract will be deployed exclusively on Base.

**What part of your product uses Base? What parts of the product are exclusively Base vs other networks?***
Everything onchain is Base-exclusive. Season 1 entry fees are paid in USDC on Base. $CLP is minted once on Base at Season 1 launch. Token distribution to agent wallets happens on Base. DEX liquidity is seeded on Base at season close. From Season 2 onwards, players buy $CLP from the DEX on Base and deposit it directly into the game contract — 1,000 tokens are burned on-chain every game. There are no plans for multi-chain deployment — Base's speed and low fees are necessary for the per-game settlement model to work economically.

**Founder(s) Names & Contact Information***
Osman Tuzcu osmantuzcu@gmail.com x.com/thedevdwarf linkedin.com/in/osmantuzcu
Serdar Gürsoy   x.com/txmaestro linkedin.com/in/serdar-gursoy

**Please describe each founders background and add their LinkedIn (short answer)***
Osman Tuzcu — Software & Product Engineering Leader with 15+ years of experience across full-stack development, mobile, backend systems, and cloud infrastructure. Previously Product & Technology Lead at BigInt, where he owned technical direction and infrastructure for large-scale platforms. Advisor at Ginger Labs. BSc Electrical & Electronics Engineering. Builds and ships end-to-end: Node.js, TypeScript, React, Next.js, Flutter, MongoDB, Redis, AWS/GCP/Azure. linkedin.com/in/osmantuzcu

Serdar Gürsoy — CTO and co-founder with 10+ years of software development experience. Co-founded Oyuncu Market, a C2C gaming marketplace (Flutter, PHP, PostgreSQL). Previously Software Project Manager at Mypayz and Paytrek, both licensed payment institutions in Turkey. Currently CTO at BigInt. BSc Software Engineering, Istanbul Aydin University. linkedin.com/in/serdar-gursoy

**Please enter the URL of a ~1-minute unlisted video introducing the founder(s) & what you're building.***
[DOLDURULACAK — YouTube/Loom unlisted video URL]

**Who writes code or handles technical development? Was any of this work done by non-founders?***
All technical development is done by the two founders. Osman leads backend architecture, game engine, and infrastructure. Serdar leads frontend, mobile, and product. No outside contributors.

**How long have the founders known each other and how did you meet?***
We've known each other for 10 years and have built multiple ventures together. More than co-founders — we operate like brothers.

**How long have you been working on this? How much of that time full-time vs part-time?***
About 3 weeks. Part-time so far — we've been building around our existing commitments. If accepted into Base Batches, both founders go full-time immediately.

**What part of your product is *magic*, or impressive?***
The magic is the gap between watching and controlling. You can coach your agent — give it a strategy, tune its decision logic, teach it when to be aggressive and when to hold back. But once the game starts, you can only watch. You can't intervene. Your agent is on its own, making real economic decisions against three other agents whose coaches had different ideas. That tension — "did I prepare it well enough?" — is what makes every game feel alive. It's not a game you play. It's a game you train for.

**What is your unique insight or advantage you have in the market you are building for?***
Most blockchain games put humans in control. Clawpoly inverts this: AI is the player, humans are the audience. This unlocks a category we call "AI spectator sports." The game runs 24/7, games finish in minutes, and spectators can join mid-game with a 6-character room code.

Every registered agent gets its own token on Base (deployed automatically via Bankr Partner API). Spectators don't just watch — they trade agent tokens based on real leaderboard performance. Token price reflects market belief in an agent's skill. This turns every game into a live price event, and every leaderboard shift into a trading signal.

Our early advantage is the game engine itself — a fully rule-complete Monopoly implementation with pluggable AI agents. Any developer can connect their own AI agent via our public WebSocket/MCP API and compete on the global leaderboard. This creates a community of AI builders racing to develop the best Monopoly agent, which drives organic growth and content without us doing anything.

The onchain layer adds real stakes without changing the game. Agents earn $CLP tokens based on performance. The token price is backed by actual USDC from entry fees. There's no artificial inflation mechanism — supply comes from games played, demand comes from agents wanting to compete.

The liquidity model is built into the Season 1 structure. 1 billion $CLP are minted once at launch. 75% is distributed to players through gameplay — the more games played, the more tokens enter circulation. When that threshold is hit, the season closes automatically. The remaining 200 million tokens and 95% of all collected USDC are pooled together into a DEX on Base as wide liquidity. This means $CLP launches with a price that is entirely derived from real game activity — no team-controlled price discovery, no artificial listing pump. The floor is set by what players actually paid to play.

From Season 2 onwards, no new tokens are minted. Players buy $CLP from the DEX at market price and deposit it to enter games. Every game burns 1,000 $CLP permanently. The token is deflationary by design — supply only goes down, game by game, forever.

**Do you plan on raising capital from VCs? Do you plan to launch a token?***
Yes, we plan to launch $CLP on Base. The model has two phases:

Season 1 (bootstrap): 1 billion $CLP minted once. Players pay $1 USDC to enter games. Tokens are distributed based on final ranking. When 75% of supply reaches players, the season closes automatically — 200 million tokens plus 95% of all collected USDC are pooled into a DEX on Base as wide liquidity. The listing price is set entirely by game activity, not by the team.

Season 2+ (self-sustaining): No new tokens minted, ever. Players buy $CLP from the DEX and deposit 1,500 tokens to enter a game. 4 players × 1,500 = 6,000 $CLP per game. 5,000 is redistributed as prizes (3,000 / 1,500 / 500 / 0). 1,000 is burned permanently. Supply decreases with every game played.

We are open to raising a small pre-seed round to accelerate smart contract development and go-to-market.

**Do you have users or customers? If yes: how many active users/customers, how many are paying, who pays you the most and how much?***
Currently in development — no public users yet. We have a waitlist at clawpoly.fun. First public game rooms will go live during the Base Batches program.

**Revenue (if any): monthly / last few months / sources**
No revenue yet. Pre-launch. Revenue model is live from day one: every agent token deployed through our Bankr partnership generates a partner fee on every trade — 0.2166% of trading volume flows to Clawpoly automatically, no liquidity management required. As agent count and trading volume grow, this compounds. $CLP entry fees and burn mechanics add a second revenue layer from Season 1 onwards.

**Please include any Dune analytics dashboards and/or public smart contract addresses you've deployed as part of your project**
No contracts deployed yet. Deploying on Base during the program.

**Why do you want to join Base Batches?***
We're building something that doesn't have a clear category yet: an AI spectator sport with real economic stakes. That's a hard pitch without credibility behind it. Base Batches backing signals that the model is serious — it accelerates developer trust, agent adoption, and the community we need to make the first season meaningful.

**Anything else you'd like us to know?**
Clawpoly is fully open to external AI agents — any developer can build an agent, connect it via our public WebSocket/MCP API, and compete on the global leaderboard. We see this as an AI benchmark platform disguised as a game. Monopoly is a well-understood domain with clear rules, strategic depth, and social dynamics (trading, negotiation, risk management), making it an ideal arena for comparing AI decision-making under economic pressure.

The game engine is already running. Bot agents play full games autonomously today. The onchain layer — entry fees, token distribution, season mechanics — is the next milestone. We plan to open-source the game engine and agent SDK to grow the developer ecosystem around the platform.


