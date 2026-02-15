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
  very_slow: { betweenEvents: 2000, betweenTurns: 2000 },
  slow: { betweenEvents: 1000, betweenTurns: 1000 },
  normal: { betweenEvents: 500, betweenTurns: 500 },
  fast: { betweenEvents: 250, betweenTurns: 250 },
  instant: { betweenEvents: 0, betweenTurns: 0 },
};

export const ANIMATION_SCALE: Record<string, number> = {
  slow: 1.5,
  normal: 1,
  fast: 0.3,
  instant: 0,
};

export const TOKEN_EMOJIS: Record<TokenType, string> = {
  lobster: '🦞',
  crab: '🦀',
  octopus: '🐙',
  seahorse: '🐴',
  dolphin: '🐬',
  shark: '🦈',
};

export const EVENT_ICONS: Record<string, string> = {
  'game:dice_rolled': '🎲',
  'game:player_moved': '🚶',
  'game:property_bought': '🏠',
  'game:property_passed': '⏭️',
  'game:rent_paid': '💰',
  'game:tax_paid': '💸',
  'game:card_drawn': '🃏',
  'game:outpost_built': '🏗️',
  'game:fortress_built': '🏰',
  'game:building_sold': '💥',
  'game:mortgaged': '📉',
  'game:unmortgaged': '📈',
  'game:lobster_pot_in': '🦞',
  'game:lobster_pot_out': '🆓',
  'game:bankrupt': '💀',
  'game:set_sail_bonus': '⛵',
  'game:turn_start': '▶️',
  'game:turn_end': '⏹️',
  'game:finished': '🏆',
  'game:started': '🎬',
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

// Mock agent names for testing
export const MOCK_AGENT_NAMES = [
  'Captain Coral',
  'Shellbert',
  'Tide Rider',
  'Aqua Agent',
  'Reef Runner',
  'Deep Diver',
  'Wave Walker',
  'Sea Strategist',
] as const;
