import { Square } from '../types/square';

const CURRENT_POSITIONS = [5, 15, 25, 35];
const UTILITY_POSITIONS = [12, 28];

export function calculateRent(
  square: Square,
  board: Square[],
  diceTotal: number
): number {
  if (square.mortgaged) return 0;
  if (!square.owner) return 0;

  switch (square.type) {
    case 'property':
      return calculatePropertyRent(square, board);
    case 'current':
      return calculateCurrentRent(square, board);
    case 'utility':
      return calculateUtilityRent(square, board, diceTotal);
    default:
      return 0;
  }
}

function calculatePropertyRent(square: Square, board: Square[]): number {
  if (square.fortress) return square.rent[5];
  if (square.outposts > 0) return square.rent[square.outposts];
  if (ownsFullColorGroup(square, board)) return square.rent[0] * 2;
  return square.rent[0];
}

function calculateCurrentRent(square: Square, board: Square[]): number {
  const count = countCurrentsOwned(square.owner!, board);
  if (count === 0) return 0;
  return square.rent[count - 1];
}

function calculateUtilityRent(square: Square, board: Square[], diceTotal: number): number {
  const count = countUtilitiesOwned(square.owner!, board);
  if (count === 1) return diceTotal * 4;
  if (count === 2) return diceTotal * 10;
  return 0;
}

export function ownsFullColorGroup(square: Square, board: Square[]): boolean {
  if (!square.colorGroup || !square.owner) return false;
  const groupSquares = board.filter(
    (s) => s.colorGroup === square.colorGroup && s.type === 'property'
  );
  return groupSquares.every((s) => s.owner === square.owner);
}

export function countCurrentsOwned(ownerId: string, board: Square[]): number {
  return CURRENT_POSITIONS.filter((pos) => board[pos].owner === ownerId).length;
}

export function countUtilitiesOwned(ownerId: string, board: Square[]): number {
  return UTILITY_POSITIONS.filter((pos) => board[pos].owner === ownerId).length;
}
