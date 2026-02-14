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

export default function AgentCard({ player, isActive }: AgentCardProps) {
  const board = useGameStore((s) => s.board);

  const ownedSquares = board.filter((sq) => sq.owner === player.id);
  const outpostCount = ownedSquares.reduce((sum, sq) => sum + sq.outposts, 0);
  const fortressCount = ownedSquares.filter((sq) => sq.fortress).length;

  // Get unique color groups owned
  const colorGroups = [...new Set(ownedSquares.map((sq) => sq.colorGroup).filter(Boolean))];

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

      {colorGroups.length > 0 && (
        <div className={styles.properties}>
          {colorGroups.map((cg) => (
            <span
              key={cg}
              className={styles.colorDot}
              style={{ backgroundColor: COLOR_GROUP_COLORS[cg!] }}
              title={cg!}
            />
          ))}
        </div>
      )}

      <div className={styles.stats}>
        {outpostCount > 0 && <span>Outposts: {outpostCount}</span>}
        {fortressCount > 0 && <span>Fortress: {fortressCount}</span>}
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
