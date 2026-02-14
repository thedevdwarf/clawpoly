'use client';

import { memo } from 'react';
import styles from './BoardSquare.module.scss';
import { COLOR_GROUP_COLORS } from '@/lib/constants';
import { ColorGroup } from '@/types/square';
import { useGameStore } from '@/stores/gameStore';
import { classNames } from '@/lib/utils';

// Static color group mapping by board position
const SQUARE_COLOR_GROUPS: Record<number, ColorGroup> = {
  1: 'Sandy Shore', 3: 'Sandy Shore',
  6: 'Coastal Waters', 8: 'Coastal Waters', 9: 'Coastal Waters',
  11: 'Coral Gardens', 13: 'Coral Gardens', 14: 'Coral Gardens',
  16: 'Tropical Seas', 18: 'Tropical Seas', 19: 'Tropical Seas',
  21: 'Volcanic Depths', 23: 'Volcanic Depths', 24: 'Volcanic Depths',
  26: 'Sunlit Expanse', 27: 'Sunlit Expanse', 29: 'Sunlit Expanse',
  31: 'The Deep', 32: 'The Deep', 34: 'The Deep',
  37: "Emperor's Realm", 39: "Emperor's Realm",
};

interface BoardSquareProps {
  index: number;
  name: string;
  row: number;
  col: number;
  position: 'corner' | 'top' | 'bottom' | 'left' | 'right';
}

const BoardSquare = memo(function BoardSquare({ index, name, row, col, position }: BoardSquareProps) {
  const selectedSquare = useGameStore((s) => s.selectedSquare);
  const selectSquare = useGameStore((s) => s.selectSquare);
  const colorGroup = SQUARE_COLOR_GROUPS[index];
  const colorHex = colorGroup ? COLOR_GROUP_COLORS[colorGroup] : undefined;
  const isSelected = selectedSquare === index;

  return (
    <div
      className={classNames(
        styles.square,
        styles[position],
        isSelected && styles.selected,
      )}
      style={{ gridRow: row, gridColumn: col }}
      onClick={() => selectSquare(isSelected ? null : index)}
      title={name}
    >
      {colorHex && (
        <div
          className={styles.colorStrip}
          style={{ backgroundColor: colorHex }}
        />
      )}
      <span className={styles.name}>{name}</span>
    </div>
  );
});

export default BoardSquare;
