'use client';

import { GameEvent } from '@/types/game';
import { useGameStore } from '@/stores/gameStore';
import { EVENT_ICONS } from '@/lib/constants';
import styles from './LogEntry.module.scss';

interface LogEntryProps {
  event: GameEvent;
}

export default function LogEntry({ event }: LogEntryProps) {
  const players = useGameStore((s) => s.players);
  const player = event.playerId ? players.find((p) => p.id === event.playerId) : null;
  const icon = EVENT_ICONS[event.type] || '•';

  // Build description from event data
  const description = buildDescription(event);

  return (
    <div className={styles.entry} style={player ? { borderLeftColor: player.color } : undefined}>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.turn}>T{event.turnNumber}</span>
      <span className={styles.text}>
        {player && <strong style={{ color: player.color }}>{player.name}</strong>}
        {' '}{description}
      </span>
    </div>
  );
}

function buildDescription(event: GameEvent): string {
  const d = event.data;
  switch (event.type) {
    case 'game:dice_rolled':
      return `rolled [${d.dice}] = ${d.total}${d.doubles ? ' DOUBLES!' : ''}`;
    case 'game:player_moved':
      return `moved to ${d.squareName || `position ${d.position}`}`;
    case 'game:property_bought':
      return `bought ${d.squareName || 'property'} for $${d.price}`;
    case 'game:rent_paid':
      return `paid $${d.amount} rent`;
    case 'game:tax_paid':
      return `paid $${d.amount} tax`;
    case 'game:card_drawn':
      return `drew: ${d.cardText || 'a card'}`;
    case 'game:outpost_built':
      return `built outpost on ${d.squareName || 'property'}`;
    case 'game:fortress_built':
      return `built fortress on ${d.squareName || 'property'}`;
    case 'game:lobster_pot_in':
      return 'went to Lobster Pot!';
    case 'game:lobster_pot_out':
      return 'escaped Lobster Pot!';
    case 'game:bankrupt':
      return 'went bankrupt!';
    case 'game:set_sail_bonus':
      return 'collected Set Sail bonus +$200';
    case 'game:finished':
      return `Game over! Winner: ${d.winnerName || 'unknown'}`;
    case 'game:turn_start':
      return 'turn begins';
    case 'game:turn_end':
      return 'turn ends';
    default:
      return event.type.replace('game:', '');
  }
}
