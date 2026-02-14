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

export const COLOR_GROUP_COLORS: Record<ColorGroup, string> = {
  'Sandy Shore': '#8B6914',
  'Coastal Waters': '#87CEEB',
  'Coral Gardens': '#FF69B4',
  'Tropical Seas': '#FF8C00',
  'Volcanic Depths': '#DC143C',
  'Sunlit Expanse': '#FFD700',
  'The Deep': '#228B22',
  "Emperor's Realm": '#191970',
};

export const BUILDING_COSTS: Record<ColorGroup, { outpost: number; fortress: number }> = {
  'Sandy Shore': { outpost: 100, fortress: 500 },
  'Coastal Waters': { outpost: 100, fortress: 500 },
  'Coral Gardens': { outpost: 150, fortress: 750 },
  'Tropical Seas': { outpost: 150, fortress: 750 },
  'Volcanic Depths': { outpost: 200, fortress: 1000 },
  'Sunlit Expanse': { outpost: 200, fortress: 1000 },
  'The Deep': { outpost: 300, fortress: 1500 },
  "Emperor's Realm": { outpost: 300, fortress: 1500 },
};

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
