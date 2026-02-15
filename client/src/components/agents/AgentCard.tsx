'use client';

import { Player, TokenType } from '@/types/player';
import { TOKEN_EMOJIS, COLOR_GROUP_COLORS } from '@/lib/constants';
import { useGameStore } from '@/stores/gameStore';
import { formatShells, classNames } from '@/lib/utils';
import styles from './AgentCard.module.scss';

interface AgentCardProps {
  player: Player;
  isActive: boolean;
}

function buildingLabel(sq: { outposts: number; fortress: boolean }): string | null {
  if (sq.fortress) return '🏰';
  if (sq.outposts > 0) return `🏗️×${sq.outposts}`;
  return null;
}

function squareIcon(type: string): string {
  if (type === 'current') return '🌊';
  if (type === 'utility') return '⚡';
  return '■';
}

export default function AgentCard({ player, isActive }: AgentCardProps) {
  const board = useGameStore((s) => s.board);

  const ownedSquares = board.filter((sq) => sq.owner === player.id);

  return (
    <div
      className={classNames(
        styles.card,
        isActive && styles.active,
        player.isBankrupt && styles.bankrupt,
      )}
      style={{ borderLeftColor: player.color }}
    >
      <div className={styles.header}>
        <span className={styles.token}>{TOKEN_EMOJIS[player.token as TokenType]}</span>
        <span className={styles.name}>{player.name}</span>
        <span className={styles.balance}>{formatShells(player.money)}</span>
      </div>

      {ownedSquares.length > 0 && (
        <div className={styles.propertyList}>
          {ownedSquares.map((sq) => (
            <div
              key={sq.index}
              className={classNames(styles.propertyItem, sq.mortgaged && styles.mortgaged)}
            >
              <span
                className={styles.propertyIcon}
                style={sq.colorGroup ? { color: COLOR_GROUP_COLORS[sq.colorGroup] } : undefined}
              >
                {squareIcon(sq.type)}
              </span>
              <span className={styles.propertyName}>{sq.name}</span>
              {buildingLabel(sq) && (
                <span className={styles.propertyBuilding}>{buildingLabel(sq)}</span>
              )}
              {sq.mortgaged && <span className={styles.propertyMortgaged}>M</span>}
            </div>
          ))}
        </div>
      )}

      <div className={styles.stats}>
        {player.escapeCards > 0 && <span>Escape: {player.escapeCards}</span>}
      </div>

      {player.inLobsterPot && (
        <div className={styles.lobsterPot}>🦞 In Lobster Pot ({player.lobsterPotTurns}t)</div>
      )}

      {isActive && !player.isBankrupt && (
        <div className={styles.activeIndicator}>◄ Current Turn</div>
      )}

      {player.isBankrupt && (
        <div className={styles.bankruptLabel}>BANKRUPT</div>
      )}
    </div>
  );
}
