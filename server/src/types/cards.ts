export type CardType = 'tide' | 'treasure_chest';

export type CardAction =
  | 'move_to'
  | 'move_to_collect'
  | 'move_back'
  | 'move_nearest_current'
  | 'move_nearest_utility'
  | 'collect'
  | 'pay'
  | 'pay_per_building'
  | 'collect_from_each'
  | 'pay_each'
  | 'escape_lobster_pot'
  | 'go_to_lobster_pot';

export interface Card {
  id: number;
  type: CardType;
  text: string;
  action: CardAction;
  data: Record<string, unknown>;
}
