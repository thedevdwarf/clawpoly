import { Square } from '../types/square';

export function createBoard(): Square[] {
  return BOARD_DATA.map((sq) => ({
    ...sq,
    owner: null,
    outposts: 0,
    fortress: false,
    mortgaged: false,
  }));
}

type BoardSquareData = Omit<Square, 'owner' | 'outposts' | 'fortress' | 'mortgaged'>;

const BOARD_DATA: BoardSquareData[] = [
  // === Bottom Row (right to left): Position 0–10 ===
  { index: 0, name: 'Set Sail', type: 'special', colorGroup: null, price: null, rent: [], outpostCost: null, fortressCost: null, mortgageValue: null },
  { index: 1, name: 'Tidal Pool Flats', type: 'property', colorGroup: 'Sandy Shore', price: 60, rent: [2, 10, 30, 90, 160, 250], outpostCost: 100, fortressCost: 500, mortgageValue: 30 },
  { index: 2, name: 'Treasure Chest', type: 'treasure_chest', colorGroup: null, price: null, rent: [], outpostCost: null, fortressCost: null, mortgageValue: null },
  { index: 3, name: 'Mangrove Shallows', type: 'property', colorGroup: 'Sandy Shore', price: 60, rent: [4, 20, 60, 180, 320, 450], outpostCost: 100, fortressCost: 500, mortgageValue: 30 },
  { index: 4, name: 'Fishing Tax', type: 'tax', colorGroup: null, price: null, rent: [], outpostCost: null, fortressCost: null, mortgageValue: null },
  { index: 5, name: "Poseidon's Current", type: 'current', colorGroup: null, price: 200, rent: [25, 50, 100, 200], outpostCost: null, fortressCost: null, mortgageValue: 100 },
  { index: 6, name: 'Ningaloo Reef', type: 'property', colorGroup: 'Coastal Waters', price: 100, rent: [6, 30, 90, 270, 400, 550], outpostCost: 100, fortressCost: 500, mortgageValue: 50 },
  { index: 7, name: 'Tide Card', type: 'tide_card', colorGroup: null, price: null, rent: [], outpostCost: null, fortressCost: null, mortgageValue: null },
  { index: 8, name: 'Red Sea Reef', type: 'property', colorGroup: 'Coastal Waters', price: 100, rent: [6, 30, 90, 270, 400, 550], outpostCost: 100, fortressCost: 500, mortgageValue: 50 },
  { index: 9, name: 'Belize Barrier Reef', type: 'property', colorGroup: 'Coastal Waters', price: 120, rent: [8, 40, 100, 300, 450, 600], outpostCost: 100, fortressCost: 500, mortgageValue: 60 },
  { index: 10, name: 'Lobster Pot / Just Visiting', type: 'special', colorGroup: null, price: null, rent: [], outpostCost: null, fortressCost: null, mortgageValue: null },

  // === Left Column (bottom to top): Position 11–20 ===
  { index: 11, name: 'Raja Ampat Gardens', type: 'property', colorGroup: 'Coral Gardens', price: 140, rent: [10, 50, 150, 450, 625, 750], outpostCost: 150, fortressCost: 750, mortgageValue: 70 },
  { index: 12, name: 'Electric Eel Power', type: 'utility', colorGroup: null, price: 150, rent: [], outpostCost: null, fortressCost: null, mortgageValue: 75 },
  { index: 13, name: 'Coral Triangle', type: 'property', colorGroup: 'Coral Gardens', price: 140, rent: [10, 50, 150, 450, 625, 750], outpostCost: 150, fortressCost: 750, mortgageValue: 70 },
  { index: 14, name: 'Tubbataha Reef', type: 'property', colorGroup: 'Coral Gardens', price: 160, rent: [12, 60, 180, 500, 700, 900], outpostCost: 150, fortressCost: 750, mortgageValue: 80 },
  { index: 15, name: 'Maelstrom Express', type: 'current', colorGroup: null, price: 200, rent: [25, 50, 100, 200], outpostCost: null, fortressCost: null, mortgageValue: 100 },
  { index: 16, name: 'Maldives Atolls', type: 'property', colorGroup: 'Tropical Seas', price: 180, rent: [14, 70, 200, 550, 750, 950], outpostCost: 150, fortressCost: 750, mortgageValue: 90 },
  { index: 17, name: 'Treasure Chest', type: 'treasure_chest', colorGroup: null, price: null, rent: [], outpostCost: null, fortressCost: null, mortgageValue: null },
  { index: 18, name: 'Seychelles Bank', type: 'property', colorGroup: 'Tropical Seas', price: 180, rent: [14, 70, 200, 550, 750, 950], outpostCost: 150, fortressCost: 750, mortgageValue: 90 },
  { index: 19, name: 'Galapagos Reserve', type: 'property', colorGroup: 'Tropical Seas', price: 200, rent: [16, 80, 220, 600, 800, 1000], outpostCost: 150, fortressCost: 750, mortgageValue: 100 },
  { index: 20, name: 'Anchor Bay', type: 'special', colorGroup: null, price: null, rent: [], outpostCost: null, fortressCost: null, mortgageValue: null },

  // === Top Row (left to right): Position 21–30 ===
  { index: 21, name: 'Hydrothermal Vents', type: 'property', colorGroup: 'Volcanic Depths', price: 220, rent: [18, 90, 250, 700, 875, 1050], outpostCost: 200, fortressCost: 1000, mortgageValue: 110 },
  { index: 22, name: 'Tide Card', type: 'tide_card', colorGroup: null, price: null, rent: [], outpostCost: null, fortressCost: null, mortgageValue: null },
  { index: 23, name: 'Volcanic Abyss', type: 'property', colorGroup: 'Volcanic Depths', price: 220, rent: [18, 90, 250, 700, 875, 1050], outpostCost: 200, fortressCost: 1000, mortgageValue: 110 },
  { index: 24, name: 'Dragon Eel Caverns', type: 'property', colorGroup: 'Volcanic Depths', price: 240, rent: [20, 100, 300, 750, 925, 1100], outpostCost: 200, fortressCost: 1000, mortgageValue: 120 },
  { index: 25, name: 'Charybdis Passage', type: 'current', colorGroup: null, price: 200, rent: [25, 50, 100, 200], outpostCost: null, fortressCost: null, mortgageValue: 100 },
  { index: 26, name: 'Sargasso Sea', type: 'property', colorGroup: 'Sunlit Expanse', price: 260, rent: [22, 110, 330, 800, 975, 1150], outpostCost: 200, fortressCost: 1000, mortgageValue: 130 },
  { index: 27, name: 'Palau Sanctuary', type: 'property', colorGroup: 'Sunlit Expanse', price: 260, rent: [22, 110, 330, 800, 975, 1150], outpostCost: 200, fortressCost: 1000, mortgageValue: 130 },
  { index: 28, name: 'Tidal Generator', type: 'utility', colorGroup: null, price: 150, rent: [], outpostCost: null, fortressCost: null, mortgageValue: 75 },
  { index: 29, name: 'Chagos Archipelago', type: 'property', colorGroup: 'Sunlit Expanse', price: 280, rent: [24, 120, 360, 850, 1025, 1200], outpostCost: 200, fortressCost: 1000, mortgageValue: 140 },
  { index: 30, name: 'Caught in the Net!', type: 'special', colorGroup: null, price: null, rent: [], outpostCost: null, fortressCost: null, mortgageValue: null },

  // === Right Column (top to bottom): Position 31–39 ===
  { index: 31, name: "Abyssal Kraken's Lair", type: 'property', colorGroup: 'The Deep', price: 300, rent: [26, 130, 390, 900, 1100, 1275], outpostCost: 300, fortressCost: 1500, mortgageValue: 150 },
  { index: 32, name: "Serpent's Trench", type: 'property', colorGroup: 'The Deep', price: 300, rent: [26, 130, 390, 900, 1100, 1275], outpostCost: 300, fortressCost: 1500, mortgageValue: 150 },
  { index: 33, name: 'Treasure Chest', type: 'treasure_chest', colorGroup: null, price: null, rent: [], outpostCost: null, fortressCost: null, mortgageValue: null },
  { index: 34, name: 'The Sunken Citadel', type: 'property', colorGroup: 'The Deep', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], outpostCost: 300, fortressCost: 1500, mortgageValue: 160 },
  { index: 35, name: 'Abyssal Drift', type: 'current', colorGroup: null, price: 200, rent: [25, 50, 100, 200], outpostCost: null, fortressCost: null, mortgageValue: 100 },
  { index: 36, name: 'Tide Card', type: 'tide_card', colorGroup: null, price: null, rent: [], outpostCost: null, fortressCost: null, mortgageValue: null },
  { index: 37, name: "Leviathan's Throne", type: 'property', colorGroup: "Emperor's Realm", price: 350, rent: [35, 175, 500, 1100, 1300, 1500], outpostCost: 300, fortressCost: 1500, mortgageValue: 175 },
  { index: 38, name: 'Pearl Tax', type: 'tax', colorGroup: null, price: null, rent: [], outpostCost: null, fortressCost: null, mortgageValue: null },
  { index: 39, name: "Claw Emperor's Domain", type: 'property', colorGroup: "Emperor's Realm", price: 400, rent: [50, 200, 600, 1400, 1700, 2000], outpostCost: 300, fortressCost: 1500, mortgageValue: 200 },
];
