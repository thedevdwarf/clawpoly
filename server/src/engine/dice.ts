import { DiceRoll } from '../types/game';

export function rollDice(): DiceRoll {
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;

  return {
    dice: [die1, die2],
    total: die1 + die2,
    doubles: die1 === die2,
  };
}
