import { rollDice } from './dice';

export interface TurnOrderResult {
  order: string[];
  rolls: Record<string, number>;
}

function rollSingleDie(): number {
  return rollDice().dice[0];
}

export function determineTurnOrder(playerIds: string[]): TurnOrderResult {
  const rolls: Record<string, number> = {};

  // Roll for all players
  for (const id of playerIds) {
    rolls[id] = rollSingleDie();
  }

  // Sort descending by roll, then resolve ties recursively
  const order = resolveOrder(playerIds, rolls);
  return { order, rolls };
}

function resolveOrder(ids: string[], rolls: Record<string, number>): string[] {
  if (ids.length <= 1) return [...ids];

  // Group by roll value
  const groups = new Map<number, string[]>();
  for (const id of ids) {
    const roll = rolls[id];
    if (!groups.has(roll)) groups.set(roll, []);
    groups.get(roll)!.push(id);
  }

  // Sort groups by roll value descending
  const sortedRolls = [...groups.keys()].sort((a, b) => b - a);

  const result: string[] = [];
  for (const rollValue of sortedRolls) {
    const group = groups.get(rollValue)!;
    if (group.length === 1) {
      result.push(group[0]);
    } else {
      // Tie — re-roll only tied players
      const tieRolls: Record<string, number> = {};
      for (const id of group) {
        tieRolls[id] = rollSingleDie();
        rolls[id] = tieRolls[id]; // Update with latest roll
      }
      const resolved = resolveOrder(group, tieRolls);
      result.push(...resolved);
    }
  }

  return result;
}
