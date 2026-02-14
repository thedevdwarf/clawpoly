'use client';

import { memo } from 'react';
import styles from './GameBoard.module.scss';
import BoardSquare from './BoardSquare';
import BoardCenter from './BoardCenter';
import { BOARD_SQUARES } from '@/lib/constants';

// Board layout: 11x11 CSS Grid
// Bottom row: positions 0-10 (right to left in classic, but grid left to right)
// Left column: positions 11-19 (bottom to top)
// Top row: positions 20-30 (left to right)
// Right column: positions 31-39 (top to bottom)

function getGridPosition(index: number): { row: number; col: number } {
  if (index >= 0 && index <= 10) {
    // Bottom row: left to right = pos 10, 9, 8, ..., 0
    return { row: 11, col: 11 - index };
  } else if (index >= 11 && index <= 19) {
    // Left column: bottom to top
    return { row: 10 - (index - 11), col: 1 };
  } else if (index >= 20 && index <= 30) {
    // Top row: left to right
    return { row: 1, col: index - 20 + 1 };
  } else {
    // Right column: top to bottom
    return { row: index - 31 + 2, col: 11 };
  }
}

function getSquareType(index: number): 'corner' | 'top' | 'bottom' | 'left' | 'right' {
  if ([0, 10, 20, 30].includes(index)) return 'corner';
  if (index > 0 && index < 10) return 'bottom';
  if (index > 10 && index < 20) return 'left';
  if (index > 20 && index < 30) return 'top';
  return 'right';
}

const GameBoard = memo(function GameBoard() {
  return (
    <div className={styles.board}>
      {Array.from({ length: 40 }, (_, i) => {
        const { row, col } = getGridPosition(i);
        const position = getSquareType(i);

        return (
          <BoardSquare
            key={i}
            index={i}
            name={BOARD_SQUARES[i]}
            row={row}
            col={col}
            position={position}
          />
        );
      })}
      <BoardCenter />
    </div>
  );
});

export default GameBoard;
