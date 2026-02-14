import { ColorGroup } from '@/types/square';
import { TokenType } from '@/types/player';

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

export const TOKEN_COLORS: Record<TokenType, string> = {
  lobster: '#e74c3c',
  crab: '#e67e22',
  octopus: '#9b59b6',
  seahorse: '#2ecc71',
  dolphin: '#3498db',
  shark: '#95a5a6',
};

export const TOKEN_LABELS: Record<TokenType, string> = {
  lobster: 'Lobster',
  crab: 'Crab',
  octopus: 'Octopus',
  seahorse: 'Seahorse',
  dolphin: 'Dolphin',
  shark: 'Shark',
};

export const BOARD_SIZE = 40;

export const SPEED_DELAYS: Record<string, { betweenEvents: number; betweenTurns: number }> = {
  slow: { betweenEvents: 2000, betweenTurns: 3000 },
  normal: { betweenEvents: 800, betweenTurns: 1500 },
  fast: { betweenEvents: 200, betweenTurns: 500 },
  instant: { betweenEvents: 0, betweenTurns: 0 },
};

export const ANIMATION_SCALE: Record<string, number> = {
  slow: 1.5,
  normal: 1,
  fast: 0.3,
  instant: 0,
};

// Board square names for reference
export const BOARD_SQUARES = [
  'Set Sail', 'Tidal Pool Flats', 'Treasure Chest', 'Mangrove Shallows',
  'Fishing Tax', "Poseidon's Current", 'Ningaloo Reef', 'Tide Card',
  'Red Sea Reef', 'Belize Barrier Reef', 'Lobster Pot / Just Visiting',
  'Raja Ampat Gardens', 'Electric Eel Power', 'Coral Triangle',
  'Tubbataha Reef', 'Maelstrom Express', 'Maldives Atolls', 'Treasure Chest',
  'Seychelles Bank', 'Galapagos Reserve', 'Anchor Bay',
  'Hydrothermal Vents', 'Tide Card', 'Volcanic Abyss', 'Dragon Eel Caverns',
  'Charybdis Passage', 'Sargasso Sea', 'Palau Sanctuary', 'Tidal Generator',
  'Chagos Archipelago', 'Caught in the Net!',
  "Abyssal Kraken's Lair", "Serpent's Trench", 'Treasure Chest',
  'The Sunken Citadel', 'Abyssal Drift', 'Tide Card',
  "Leviathan's Throne", 'Pearl Tax', "Claw Emperor's Domain",
] as const;
