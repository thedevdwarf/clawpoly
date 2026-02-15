import { v4 as uuidv4 } from 'uuid';
import { GameState, GameEvent, DiceRoll } from '../types/game';
import { Player } from '../types/player';
import { Square } from '../types/square';
import { AgentDecision } from '../types/agent';
import { rollDice } from './dice';
import { calculateRent } from './rent';
import {
  canBuildWithMoney,
  canUpgradeWithMoney,
  getBuildableProperties,
  getUpgradeableToFortress,
  build,
  upgradeToFortress,
} from './building';
import { resolveBankruptcy, calculateNetWorth } from './bankruptcy';
import { executeCard, CardResult } from './cardExecutor';
import { SPEED_DELAYS } from '../config';

export class GameEngine {
  private state: GameState;
  private agents: Map<string, AgentDecision>;
  private eventCallbacks: Array<(event: GameEvent) => void> = [];
  private eventSequence = 0;
  private consecutiveDoubles = 0;
  private lastRoll: DiceRoll | null = null;
  private delayMs: number;
  private paused = false;
  private pausePromise: { resolve: () => void } | null = null;

  constructor(state: GameState, agents: Map<string, AgentDecision>) {
    this.state = state;
    this.agents = agents;
    this.delayMs = SPEED_DELAYS[state.gameSpeed] || 500;
  }

  // --- Pause/Resume ---

  pause(): void {
    this.paused = true;
    this.state.gamePhase = 'paused';
  }

  resume(): void {
    this.paused = false;
    this.state.gamePhase = 'playing';

    if (this.pausePromise) {
      this.pausePromise.resolve();
      this.pausePromise = null;
    }
  }

  isPaused(): boolean {
    return this.paused;
  }

  // --- Event System ---

  onEvent(callback: (event: GameEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  private async delay(): Promise<void> {
    // If paused, wait indefinitely until resume is called
    if (this.paused) {
      await new Promise<void>(resolve => {
        this.pausePromise = { resolve };
      });
      // After resume, continue with the normal delay
    }

    if (this.delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delayMs));
    }
  }

  private async emit(type: string, playerId: string | null, data: Record<string, unknown>): Promise<GameEvent> {
    const event: GameEvent = {
      id: uuidv4(),
      roomId: this.state.roomId,
      sequence: this.eventSequence++,
      turnNumber: this.state.turnNumber,
      type,
      playerId,
      data,
      timestamp: new Date().toISOString(),
    };
    for (const cb of this.eventCallbacks) {
      cb(event);
    }
    await this.delay();
    return event;
  }

  // --- State Access ---

  getState(): Readonly<GameState> {
    return this.state;
  }

  // --- Game Lifecycle ---

  async runGame(): Promise<void> {
    this.state.gamePhase = 'playing';
    await this.emit('game:started', null, {
      players: this.state.players,
      board: this.state.board,
      currentPlayerIndex: this.state.currentPlayerIndex,
      turnNumber: this.state.turnNumber,
    });

    while (this.state.gamePhase !== 'finished') {
      await this.executeTurn();

      if (this.checkGameEnd()) break;

      this.advanceToNextPlayer();
    }
  }

  // --- Turn Execution ---

  private async executeTurn(): Promise<void> {
    const player = this.getCurrentPlayer();
    if (player.isBankrupt) return;

    await this.emit('game:turn_start', player.id, {
      playerName: player.name,
      turnNumber: this.state.turnNumber,
      inLobsterPot: player.inLobsterPot,
    });

    if (player.inLobsterPot) {
      await this.handleLobsterPotTurn(player);
    } else {
      await this.handleNormalTurn(player);
    }

    await this.emit('game:turn_end', player.id, { playerName: player.name });
  }

  private async handleNormalTurn(player: Player): Promise<void> {
    this.consecutiveDoubles = 0;

    let keepRolling = true;
    while (keepRolling && !player.isBankrupt) {
      const roll = rollDice();
      this.lastRoll = roll;

      await this.emit('game:dice_rolled', player.id, {
        dice: roll.dice,
        total: roll.total,
        doubles: roll.doubles,
      });

      if (roll.doubles) {
        this.consecutiveDoubles++;
      } else {
        this.consecutiveDoubles = 0;
      }

      // Triple doubles → lobster pot
      if (this.consecutiveDoubles >= 3) {
        this.sendToLobsterPot(player, 'triple_doubles');
        break;
      }

      // Move
      const oldPos = player.position;
      const newPos = (player.position + roll.total) % 40;
      const passedSetSail = newPos < oldPos && newPos !== 0;

      player.position = newPos;
      await this.emit('game:player_moved', player.id, {
        from: oldPos,
        to: newPos,
        squareName: this.state.board[newPos].name,
      });

      // Set Sail bonus
      if (passedSetSail || (oldPos !== 0 && newPos === 0)) {
        this.paySetSailBonus(player);
      }

      // Square action
      await this.executeSquareAction(player, this.state.board[newPos], roll);

      // Building phase
      if (!player.isBankrupt && !player.inLobsterPot) {
        await this.offerBuildingPhase(player);
      }

      // Continue if doubles (and not sent to lobster pot)
      keepRolling = roll.doubles && !player.inLobsterPot && !player.isBankrupt;
    }
  }

  private async handleLobsterPotTurn(player: Player): Promise<void> {
    const agent = this.getAgent(player.id);
    const decision = await agent.decideLobsterPot(player, this.state);

    if (decision === 'card' && player.escapeCards > 0) {
      player.escapeCards--;
      this.freeFromLobsterPot(player, 'card');
      await this.rollMoveAndAct(player);
      return;
    }

    if (decision === 'pay' && player.money >= 50) {
      player.money -= 50;
      await this.emit('game:tax_paid', player.id, { amount: 50, reason: 'lobster_pot_fee' });
      this.freeFromLobsterPot(player, 'pay');
      await this.rollMoveAndAct(player);
      return;
    }

    // Roll for escape
    const roll = rollDice();
    this.lastRoll = roll;
    await this.emit('game:dice_rolled', player.id, {
      dice: roll.dice,
      total: roll.total,
      doubles: roll.doubles,
    });

    if (roll.doubles) {
      this.freeFromLobsterPot(player, 'doubles');
      const oldPos = player.position;
      const newPos = (player.position + roll.total) % 40;
      player.position = newPos;
      await this.emit('game:player_moved', player.id, { from: oldPos, to: newPos, squareName: this.state.board[newPos].name });
      if (newPos < oldPos) this.paySetSailBonus(player);
      await this.executeSquareAction(player, this.state.board[newPos], roll);
      if (!player.isBankrupt) await this.offerBuildingPhase(player);
      // No extra roll even though doubles were rolled
    } else {
      player.lobsterPotTurns++;
      if (player.lobsterPotTurns >= 3) {
        // 3rd failed attempt — must pay and move
        await this.chargePlayer(player, 50, null);
        this.freeFromLobsterPot(player, 'forced_pay');
        const oldPos = player.position;
        const newPos = (player.position + roll.total) % 40;
        player.position = newPos;
        await this.emit('game:player_moved', player.id, { from: oldPos, to: newPos, squareName: this.state.board[newPos].name });
        if (newPos < oldPos) this.paySetSailBonus(player);
        await this.executeSquareAction(player, this.state.board[newPos], roll);
        if (!player.isBankrupt) await this.offerBuildingPhase(player);
      }
      // else: stays in pot, turn ends
    }
  }

  private async rollMoveAndAct(player: Player): Promise<void> {
    const roll = rollDice();
    this.lastRoll = roll;
    await this.emit('game:dice_rolled', player.id, {
      dice: roll.dice,
      total: roll.total,
      doubles: roll.doubles,
    });

    const oldPos = player.position;
    const newPos = (player.position + roll.total) % 40;
    player.position = newPos;
    await this.emit('game:player_moved', player.id, { from: oldPos, to: newPos, squareName: this.state.board[newPos].name });
    if (newPos < oldPos || (oldPos !== 0 && newPos === 0)) {
      this.paySetSailBonus(player);
    }

    await this.executeSquareAction(player, this.state.board[newPos], roll);
    if (!player.isBankrupt) await this.offerBuildingPhase(player);
  }

  // --- Square Actions ---

  private async executeSquareAction(player: Player, square: Square, roll: DiceRoll): Promise<void> {
    switch (square.type) {
      case 'property':
        await this.handlePropertyLanding(player, square, roll);
        break;
      case 'current':
        await this.handleCurrentLanding(player, square, roll);
        break;
      case 'utility':
        await this.handleUtilityLanding(player, square, roll);
        break;
      case 'tax':
        await this.handleTaxSquare(player, square);
        break;
      case 'tide_card':
      case 'treasure_chest':
        await this.handleCardSquare(player, square);
        break;
      case 'special':
        this.handleSpecialSquare(player, square);
        break;
    }
  }

  private async handlePropertyLanding(player: Player, square: Square, roll: DiceRoll, rentMultiplier = 1): Promise<void> {
    if (!square.owner) {
      await this.offerBuy(player, square);
    } else if (square.owner !== player.id && !square.mortgaged) {
      const rent = calculateRent(square, this.state.board, roll.total) * rentMultiplier;
      const owner = this.findPlayer(square.owner);
      if (owner && rent > 0) {
        await this.emit('game:rent_paid', player.id, {
          squareName: square.name,
          amount: rent,
          toPlayer: owner.name,
        });
        await this.chargePlayer(player, rent, owner.id);
      }
    }
  }

  private async handleCurrentLanding(player: Player, square: Square, roll: DiceRoll, rentMultiplier =1): Promise<void> {
    if (!square.owner) {
      await this.offerBuy(player, square);
    } else if (square.owner !== player.id && !square.mortgaged) {
      const rent = calculateRent(square, this.state.board, roll.total) * rentMultiplier;
      const owner = this.findPlayer(square.owner);
      if (owner && rent > 0) {
        await this.emit('game:rent_paid', player.id, {
          squareName: square.name,
          amount: rent,
          toPlayer: owner.name,
        });
        await this.chargePlayer(player, rent, owner.id);
      }
    }
  }

  private async handleUtilityLanding(
    player: Player,
    square: Square,
    roll: DiceRoll,
    forcedDiceTotal?: number,
    forcedMultiplier?: number
  ): Promise<void> {
    if (!square.owner) {
      await this.offerBuy(player, square);
    } else if (square.owner !== player.id && !square.mortgaged) {
      const diceTotal = forcedDiceTotal ?? roll.total;
      let rent: number;
      if (forcedMultiplier) {
        // Card-forced: always use the card multiplier
        rent = diceTotal * forcedMultiplier;
      } else {
        rent = calculateRent(square, this.state.board, diceTotal);
      }
      const owner = this.findPlayer(square.owner);
      if (owner && rent > 0) {
        await this.emit('game:rent_paid', player.id, {
          squareName: square.name,
          amount: rent,
          toPlayer: owner.name,
        });
        await this.chargePlayer(player, rent, owner.id);
      }
    }
  }

  private async handleTaxSquare(player: Player, square: Square): Promise<void> {
    const amount = square.index === 4 ? 200 : 100; // Fishing Tax: 200, Pearl Tax: 100
    await this.emit('game:tax_paid', player.id, {
      squareName: square.name,
      amount,
    });
    await this.chargePlayer(player, amount, null);
  }

  private async handleCardSquare(player: Player, square: Square): Promise<void> {
    const deck = square.type === 'tide_card' ? this.state.tideCards : this.state.treasureChestCards;
    if (deck.length === 0) return;

    const card = deck.shift()!;
    deck.push(card); // Return to bottom

    await this.emit('game:card_drawn', player.id, {
      cardType: card.type,
      cardText: card.text,
      cardAction: card.action,
    });

    const result = executeCard(card, player, this.state);
    await this.applyCardResult(player, result);
  }

  private async applyCardResult(player: Player, result: CardResult): Promise<void> {
    // Escape card
    if (result.earnedEscapeCard) {
      player.escapeCards++;
      return;
    }

    // Go to lobster pot
    if (result.gotoLobsterPot) {
      this.sendToLobsterPot(player, 'card');
      return;
    }

    // Movement
    if (result.movedTo !== null) {
      const oldPos = player.position;
      player.position = result.movedTo;

      await this.emit('game:player_moved', player.id, {
        from: oldPos,
        to: result.movedTo,
        squareName: this.state.board[result.movedTo].name,
        reason: 'card',
      });

      if (result.passedSetSail) {
        this.paySetSailBonus(player);
      }

      // Execute landing square action
      const landedSquare = this.state.board[result.movedTo];
      const roll = this.lastRoll || { dice: [0, 0] as [number, number], total: 0, doubles: false };

      if (landedSquare.type === 'current') {
        await this.handleCurrentLanding(player, landedSquare, roll, result.rentMultiplier);
      } else if (landedSquare.type === 'utility') {
        await this.handleUtilityLanding(
          player,
          landedSquare,
          roll,
          result.additionalRentDiceTotal || undefined,
          result.rentMultiplier > 1 ? result.rentMultiplier : undefined
        );
      } else if (landedSquare.type === 'property') {
        await this.handlePropertyLanding(player, landedSquare, roll, result.rentMultiplier);
      } else if (landedSquare.type === 'tax') {
        await this.handleTaxSquare(player, landedSquare);
      } else if (landedSquare.type === 'special') {
        this.handleSpecialSquare(player, landedSquare);
      }
      // Don't recursively draw cards when landing on card square from a card
      return;
    }

    // Money changes
    if (result.moneyDelta > 0) {
      player.money += result.moneyDelta;
    } else if (result.moneyDelta < 0) {
      await this.chargePlayer(player, -result.moneyDelta, null);
    }

    // Collect from each
    if (result.collectFromEachAmount > 0) {
      const amount = result.collectFromEachAmount;
      for (const other of this.getActivePlayers()) {
        if (other.id === player.id) continue;
        if (other.money >= amount) {
          other.money -= amount;
          player.money += amount;
        } else {
          // Pay what they can, may trigger bankruptcy
          const canPay = other.money;
          other.money = 0;
          player.money += canPay;
          const result = resolveBankruptcy(other, amount - canPay, player.id, this.state);
          if (result.wentBankrupt) {
            await this.emit('game:bankrupt', other.id, { creditorId: player.id });
          }
        }
      }
    }

    // Pay each
    if (result.payEachAmount > 0) {
      const amount = result.payEachAmount;
      for (const other of this.getActivePlayers()) {
        if (other.id === player.id) continue;
        await this.chargePlayer(player, amount, other.id);
        if (player.isBankrupt) break;
      }
    }
  }

  private handleSpecialSquare(player: Player, square: Square): void {
    if (square.index === 30) {
      // Caught in the Net!
      this.sendToLobsterPot(player, 'square');
    }
    // pos 0 (Set Sail), 10 (Just Visiting), 20 (Anchor Bay) — no action
  }

  // --- Lobster Pot ---

  private sendToLobsterPot(player: Player, reason: string): void {
    player.position = 10;
    player.inLobsterPot = true;
    player.lobsterPotTurns = 0;
    void this.emit('game:lobster_pot_in', player.id, { reason });
  }

  private freeFromLobsterPot(player: Player, method: string): void {
    player.inLobsterPot = false;
    player.lobsterPotTurns = 0;
    void this.emit('game:lobster_pot_out', player.id, { method });
  }

  // --- Building Phase ---

  private async offerBuildingPhase(player: Player): Promise<void> {
    const agent = this.getAgent(player.id);
    let attempts = 0;
    const maxAttempts = 50; // Safety limit

    while (attempts < maxAttempts) {
      attempts++;
      const buildable = getBuildableProperties(this.state.board, player.id)
        .filter((idx) => canBuildWithMoney(idx, this.state.board, player));
      const upgradeable = getUpgradeableToFortress(this.state.board, player.id)
        .filter((idx) => canUpgradeWithMoney(idx, this.state.board, player));

      if (buildable.length === 0 && upgradeable.length === 0) break;

      const decision = await agent.decideBuild(player, buildable, upgradeable, this.state);
      if (!decision) break;

      if (decision.action === 'upgrade' && upgradeable.includes(decision.squareIndex)) {
        upgradeToFortress(decision.squareIndex, this.state.board, player);
        await this.emit('game:fortress_built', player.id, {
          squareIndex: decision.squareIndex,
          squareName: this.state.board[decision.squareIndex].name,
          cost: this.state.board[decision.squareIndex].fortressCost,
        });
      } else if (decision.action === 'build' && buildable.includes(decision.squareIndex)) {
        build(decision.squareIndex, this.state.board, player);
        await this.emit('game:outpost_built', player.id, {
          squareIndex: decision.squareIndex,
          squareName: this.state.board[decision.squareIndex].name,
          outposts: this.state.board[decision.squareIndex].outposts,
          cost: this.state.board[decision.squareIndex].outpostCost,
        });
      } else {
        break; // Invalid decision
      }
    }
  }

  // --- Payment ---

  private async offerBuy(player: Player, square: Square): Promise<void> {
    if (!square.price || player.money < square.price) return;

    const agent = this.getAgent(player.id);
    const wantsToBuy = await agent.decideBuy(player, square, this.state);

    if (wantsToBuy && player.money >= square.price) {
      player.money -= square.price;
      square.owner = player.id;
      player.properties.push(square.index);
      await this.emit('game:property_bought', player.id, {
        squareIndex: square.index,
        squareName: square.name,
        price: square.price,
      });
    } else {
      await this.emit('game:property_passed', player.id, {
        squareIndex: square.index,
        squareName: square.name,
      });
    }
  }

  private async chargePlayer(payer: Player, amount: number, recipientId: string | null): Promise<void> {
    if (payer.money >= amount) {
      payer.money -= amount;
      if (recipientId) {
        const recipient = this.findPlayer(recipientId);
        if (recipient) recipient.money += amount;
      }
    } else {
      // Attempt bankruptcy resolution
      const paid = payer.money;
      const result = resolveBankruptcy(payer, amount, recipientId, this.state);

      if (result.wentBankrupt) {
        await this.emit('game:bankrupt', payer.id, {
          debtAmount: amount,
          creditorId: recipientId,
        });
      } else {
        // Was able to raise funds — now pay
        payer.money -= amount;
        if (recipientId) {
          const recipient = this.findPlayer(recipientId);
          if (recipient) recipient.money += amount;
        }
      }
    }
  }

  private paySetSailBonus(player: Player): void {
    player.money += 200;
    void this.emit('game:set_sail_bonus', player.id, { amount: 200, newBalance: player.money });
  }

  // --- Game End ---

  private checkGameEnd(): boolean {
    const activePlayers = this.getActivePlayers();

    // Last player standing
    if (activePlayers.length <= 1) {
      const winner = activePlayers[0] || this.state.players[0];
      this.finishGame(winner);
      return true;
    }

    // Turn limit
    if (this.state.turnLimit && this.state.turnNumber >= this.state.turnLimit) {
      const winner = this.determineWealthiestPlayer();
      this.finishGame(winner);
      return true;
    }

    return false;
  }

  private determineWealthiestPlayer(): Player {
    let richest = this.getActivePlayers()[0];
    let maxWealth = 0;

    for (const player of this.getActivePlayers()) {
      const wealth = calculateNetWorth(player, this.state.board);
      if (wealth > maxWealth) {
        maxWealth = wealth;
        richest = player;
      }
    }

    return richest;
  }

  private finishGame(winner: Player): void {
    this.state.gamePhase = 'finished';
    this.state.winner = winner;

    const standings = this.state.players
      .map((p) => ({
        name: p.name,
        token: p.token,
        money: p.money,
        netWorth: calculateNetWorth(p, this.state.board),
        isBankrupt: p.isBankrupt,
      }))
      .sort((a, b) => b.netWorth - a.netWorth);

    void this.emit('game:finished', winner.id, {
      winner,
      winnerName: winner.name,
      totalTurns: this.state.turnNumber,
      standings,
    });
  }

  // --- Turn Advancement ---

  private advanceToNextPlayer(): void {
    const playerCount = this.state.players.length;
    let next = (this.state.currentPlayerIndex + 1) % playerCount;

    // Track if we've lapped (all players had a turn)
    if (next === 0) {
      this.state.turnNumber++;
    }

    // Skip bankrupt players
    let safety = 0;
    while (this.state.players[next].isBankrupt && safety < playerCount) {
      next = (next + 1) % playerCount;
      if (next === 0) this.state.turnNumber++;
      safety++;
    }

    this.state.currentPlayerIndex = next;
  }

  // --- Helpers ---

  private getCurrentPlayer(): Player {
    return this.state.players[this.state.currentPlayerIndex];
  }

  private findPlayer(id: string): Player | undefined {
    return this.state.players.find((p) => p.id === id);
  }

  private getActivePlayers(): Player[] {
    return this.state.players.filter((p) => !p.isBankrupt);
  }

  private getAgent(playerId: string): AgentDecision {
    const agent = this.agents.get(playerId);
    if (!agent) throw new Error(`No agent registered for player ${playerId}`);
    return agent;
  }
}
