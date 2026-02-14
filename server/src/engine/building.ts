import { Square } from '../types/square';
import { Player } from '../types/player';

export function canBuild(squareIndex: number, board: Square[], playerId: string): boolean {
  const square = board[squareIndex];
  if (square.type !== 'property') return false;
  if (square.owner !== playerId) return false;
  if (square.mortgaged) return false;
  if (square.fortress) return false;
  if (square.outposts >= 4) return false;
  if (!square.outpostCost) return false;
  if (!ownsEntireGroup(square, board, playerId)) return false;
  if (groupHasMortgagedProperty(square, board)) return false;

  // Even building rule: can't build if this property is ahead of siblings
  const groupSquares = getGroupSquares(square, board);
  const minOutposts = Math.min(...groupSquares.map((s) => s.outposts));
  if (square.outposts > minOutposts) return false;

  return true;
}

export function canBuildWithMoney(squareIndex: number, board: Square[], player: Player): boolean {
  if (!canBuild(squareIndex, board, player.id)) return false;
  return player.money >= board[squareIndex].outpostCost!;
}

export function canUpgradeToFortress(squareIndex: number, board: Square[], playerId: string): boolean {
  const square = board[squareIndex];
  if (square.type !== 'property') return false;
  if (square.owner !== playerId) return false;
  if (square.mortgaged) return false;
  if (square.fortress) return false;
  if (square.outposts !== 4) return false;
  if (!square.fortressCost) return false;
  if (!ownsEntireGroup(square, board, playerId)) return false;

  // Even fortress rule: all siblings must also have 4 outposts or a fortress
  const siblings = getGroupSquares(square, board).filter((s) => s.index !== squareIndex);
  return siblings.every((s) => s.outposts === 4 || s.fortress);
}

export function canUpgradeWithMoney(squareIndex: number, board: Square[], player: Player): boolean {
  if (!canUpgradeToFortress(squareIndex, board, player.id)) return false;
  return player.money >= board[squareIndex].fortressCost!;
}

export function getBuildableProperties(board: Square[], playerId: string): number[] {
  return board
    .filter((s) => s.type === 'property' && canBuild(s.index, board, playerId))
    .map((s) => s.index);
}

export function getUpgradeableToFortress(board: Square[], playerId: string): number[] {
  return board
    .filter((s) => s.type === 'property' && canUpgradeToFortress(s.index, board, playerId))
    .map((s) => s.index);
}

export function build(squareIndex: number, board: Square[], player: Player): void {
  const square = board[squareIndex];
  square.outposts += 1;
  player.money -= square.outpostCost!;
}

export function upgradeToFortress(squareIndex: number, board: Square[], player: Player): void {
  const square = board[squareIndex];
  square.outposts = 0;
  square.fortress = true;
  player.money -= square.fortressCost!;
}

export function sellBuilding(squareIndex: number, board: Square[], player: Player): number {
  const square = board[squareIndex];
  const refund = getBuildingSellValue(square);

  if (square.fortress) {
    square.fortress = false;
    // Outposts are NOT restored when selling a fortress
  } else if (square.outposts > 0) {
    square.outposts -= 1;
  } else {
    return 0;
  }

  player.money += refund;
  return refund;
}

export function getBuildingSellValue(square: Square): number {
  if (square.fortress && square.fortressCost) {
    return Math.floor(square.fortressCost / 2);
  }
  if (square.outposts > 0 && square.outpostCost) {
    return Math.floor(square.outpostCost / 2);
  }
  return 0;
}

export function hasBuildings(squareIndex: number, board: Square[]): boolean {
  const square = board[squareIndex];
  return square.outposts > 0 || square.fortress;
}

export function playerHasBuildings(board: Square[], playerId: string): boolean {
  return board.some(
    (s) => s.owner === playerId && (s.outposts > 0 || s.fortress)
  );
}

// --- Helpers ---

function ownsEntireGroup(square: Square, board: Square[], playerId: string): boolean {
  if (!square.colorGroup) return false;
  const group = getGroupSquares(square, board);
  return group.every((s) => s.owner === playerId);
}

function getGroupSquares(square: Square, board: Square[]): Square[] {
  return board.filter(
    (s) => s.colorGroup === square.colorGroup && s.type === 'property'
  );
}

function groupHasMortgagedProperty(square: Square, board: Square[]): boolean {
  return getGroupSquares(square, board).some((s) => s.mortgaged);
}
