import { GameState } from '../types/game';
import { Player } from '../types/player';
import { Card } from '../types/cards';
import { rollDice } from './dice';

const CURRENT_POSITIONS = [5, 15, 25, 35];
const UTILITY_POSITIONS = [12, 28];

export interface CardResult {
  movedTo: number | null;
  passedSetSail: boolean;
  moneyDelta: number;
  gotoLobsterPot: boolean;
  earnedEscapeCard: boolean;
  rentMultiplier: number;
  additionalRentDiceRoll: [number, number] | null;
  additionalRentDiceTotal: number;
  payEachAmount: number;
  collectFromEachAmount: number;
}

function emptyResult(): CardResult {
  return {
    movedTo: null,
    passedSetSail: false,
    moneyDelta: 0,
    gotoLobsterPot: false,
    earnedEscapeCard: false,
    rentMultiplier: 1,
    additionalRentDiceRoll: null,
    additionalRentDiceTotal: 0,
    payEachAmount: 0,
    collectFromEachAmount: 0,
  };
}

export function executeCard(card: Card, player: Player, state: GameState): CardResult {
  const result = emptyResult();

  switch (card.action) {
    case 'move_to': {
      const pos = card.data.position as number;
      result.movedTo = pos;
      result.passedSetSail = false; // move_to never collects Set Sail
      break;
    }

    case 'move_to_collect': {
      const pos = card.data.position as number;
      result.movedTo = pos;
      // Passed Set Sail if wrapping around (new position < current position)
      // or landing on Set Sail itself
      result.passedSetSail = pos <= player.position && pos !== player.position;
      break;
    }

    case 'move_back': {
      const spaces = card.data.spaces as number;
      result.movedTo = (player.position - spaces + 40) % 40;
      result.passedSetSail = false; // backward movement never collects
      break;
    }

    case 'move_nearest_current': {
      const nearest = findNearest(player.position, CURRENT_POSITIONS);
      result.movedTo = nearest;
      result.passedSetSail = nearest < player.position;
      result.rentMultiplier = (card.data.multiplier as number) || 2;
      break;
    }

    case 'move_nearest_utility': {
      const nearest = findNearest(player.position, UTILITY_POSITIONS);
      result.movedTo = nearest;
      result.passedSetSail = nearest < player.position;
      // Roll fresh dice for utility rent
      const roll = rollDice();
      result.additionalRentDiceRoll = roll.dice;
      result.additionalRentDiceTotal = roll.total;
      result.rentMultiplier = (card.data.multiplier as number) || 10;
      break;
    }

    case 'collect': {
      result.moneyDelta = card.data.amount as number;
      break;
    }

    case 'pay': {
      result.moneyDelta = -(card.data.amount as number);
      break;
    }

    case 'pay_per_building': {
      const perOutpost = card.data.perOutpost as number;
      const perFortress = card.data.perFortress as number;
      let totalOutposts = 0;
      let totalFortresses = 0;

      for (const square of state.board) {
        if (square.owner === player.id) {
          totalOutposts += square.outposts;
          if (square.fortress) totalFortresses++;
        }
      }

      result.moneyDelta = -(totalOutposts * perOutpost + totalFortresses * perFortress);
      break;
    }

    case 'collect_from_each': {
      result.collectFromEachAmount = card.data.amount as number;
      break;
    }

    case 'pay_each': {
      result.payEachAmount = card.data.amount as number;
      break;
    }

    case 'escape_lobster_pot': {
      result.earnedEscapeCard = true;
      break;
    }

    case 'go_to_lobster_pot': {
      result.gotoLobsterPot = true;
      break;
    }
  }

  return result;
}

function findNearest(currentPosition: number, targets: number[]): number {
  let minDist = 41;
  let nearest = targets[0];

  for (const target of targets) {
    const dist = (target - currentPosition + 40) % 40;
    if (dist > 0 && dist < minDist) {
      minDist = dist;
      nearest = target;
    }
  }

  return nearest;
}
