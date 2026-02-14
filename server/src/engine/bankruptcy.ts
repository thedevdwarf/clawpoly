import { GameState } from '../types/game';
import { Player } from '../types/player';
import { Square } from '../types/square';
import { sellBuilding, getBuildingSellValue, playerHasBuildings } from './building';

export interface BankruptcyResult {
  wentBankrupt: boolean;
}

export function resolveBankruptcy(
  player: Player,
  debtAmount: number,
  creditorId: string | null,
  state: GameState
): BankruptcyResult {
  // Already can pay?
  if (player.money >= debtAmount) {
    return { wentBankrupt: false };
  }

  // Step 1: Sell all buildings
  sellAllBuildings(player, state.board);

  if (player.money >= debtAmount) {
    return { wentBankrupt: false };
  }

  // Step 2: Mortgage all properties
  mortgageAllProperties(player, state.board);

  if (player.money >= debtAmount) {
    return { wentBankrupt: false };
  }

  // Step 3: Bankrupt
  player.isBankrupt = true;

  if (creditorId) {
    const creditor = state.players.find((p) => p.id === creditorId);
    if (creditor) {
      transferAssetsToCreditor(player, creditor, state.board);
    }
  } else {
    returnAssetsToBank(player, state.board);
  }

  return { wentBankrupt: true };
}

export function calculateNetWorth(player: Player, board: Square[]): number {
  let worth = player.money;

  for (const propIndex of player.properties) {
    const square = board[propIndex];
    if (square.mortgaged) {
      // Mortgaged properties count at mortgage value
      worth += square.mortgageValue || 0;
    } else {
      // Unmortgaged properties count at full price
      worth += square.price || 0;
    }

    // Building values at half cost
    worth += getBuildingSellValue(square);
    if (square.outposts > 0 && square.outpostCost) {
      // getBuildingSellValue only returns for 1 outpost, multiply
      worth += Math.floor(square.outpostCost / 2) * (square.outposts - 1);
    }
  }

  return worth;
}

function sellAllBuildings(player: Player, board: Square[]): void {
  // Keep selling until no buildings remain
  let hasMore = true;
  while (hasMore) {
    hasMore = false;
    for (const propIndex of player.properties) {
      const square = board[propIndex];
      if (square.fortress || square.outposts > 0) {
        sellBuilding(propIndex, board, player);
        hasMore = true;
      }
    }
  }
}

function mortgageAllProperties(player: Player, board: Square[]): void {
  for (const propIndex of player.properties) {
    const square = board[propIndex];
    if (!square.mortgaged && square.mortgageValue) {
      square.mortgaged = true;
      player.money += square.mortgageValue;
    }
  }
}

function transferAssetsToCreditor(debtor: Player, creditor: Player, board: Square[]): void {
  // Transfer remaining money
  creditor.money += debtor.money;
  debtor.money = 0;

  // Transfer escape cards
  creditor.escapeCards += debtor.escapeCards;
  debtor.escapeCards = 0;

  // Transfer properties
  for (const propIndex of debtor.properties) {
    board[propIndex].owner = creditor.id;
    creditor.properties.push(propIndex);
  }
  debtor.properties = [];
}

function returnAssetsToBank(debtor: Player, board: Square[]): void {
  debtor.money = 0;
  debtor.escapeCards = 0;

  for (const propIndex of debtor.properties) {
    const square = board[propIndex];
    square.owner = null;
    square.mortgaged = false;
    square.outposts = 0;
    square.fortress = false;
  }
  debtor.properties = [];
}
