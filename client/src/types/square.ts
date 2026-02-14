export type SquareType = 'property' | 'current' | 'utility' | 'tax' | 'tide_card' | 'treasure_chest' | 'special';

export type ColorGroup =
  | 'Sandy Shore'
  | 'Coastal Waters'
  | 'Coral Gardens'
  | 'Tropical Seas'
  | 'Volcanic Depths'
  | 'Sunlit Expanse'
  | 'The Deep'
  | "Emperor's Realm";

export interface Square {
  index: number;
  name: string;
  type: SquareType;
  colorGroup: ColorGroup | null;
  price: number | null;
  rent: number[];
  outpostCost: number | null;
  fortressCost: number | null;
  owner: string | null;
  outposts: number;
  fortress: boolean;
  mortgaged: boolean;
  mortgageValue: number | null;
}
