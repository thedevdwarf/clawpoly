import { Card } from '../types/cards';

export function createTideCards(): Card[] {
  return shuffle([...TIDE_CARDS]);
}

export function createTreasureChestCards(): Card[] {
  return shuffle([...TREASURE_CHEST_CARDS]);
}

function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const TIDE_CARDS: Card[] = [
  { id: 1, type: 'tide', text: "A strong current carries you to Claw Emperor's Domain!", action: 'move_to', data: { position: 39 } },
  { id: 2, type: 'tide', text: 'Favorable winds! Sail to Set Sail (collect 200 Shells)', action: 'move_to_collect', data: { position: 0, collect: 200 } },
  { id: 3, type: 'tide', text: 'A sea turtle guides you to Dragon Eel Caverns. If you pass Set Sail, collect 200 Shells', action: 'move_to_collect', data: { position: 24, collect: 200 } },
  { id: 4, type: 'tide', text: 'Follow the bioluminescent trail to Raja Ampat Gardens. If you pass Set Sail, collect 200 Shells', action: 'move_to_collect', data: { position: 11, collect: 200 } },
  { id: 5, type: 'tide', text: 'Drift to the nearest Current. Pay owner twice the toll', action: 'move_nearest_current', data: { multiplier: 2 } },
  { id: 6, type: 'tide', text: 'Drift to the nearest Current. Pay owner twice the toll', action: 'move_nearest_current', data: { multiplier: 2 } },
  { id: 7, type: 'tide', text: 'Swim to nearest Utility. If unowned, you may claim it. If owned, roll dice and pay owner 10x amount', action: 'move_nearest_utility', data: { multiplier: 10 } },
  { id: 8, type: 'tide', text: 'A merchant ship drops 50 Shells overboard. Collect them!', action: 'collect', data: { amount: 50 } },
  { id: 9, type: 'tide', text: 'Escape the Lobster Pot Free card', action: 'escape_lobster_pot', data: {} },
  { id: 10, type: 'tide', text: 'Undertow pulls you back 3 spaces', action: 'move_back', data: { spaces: 3 } },
  { id: 11, type: 'tide', text: "Caught in a fisherman's net! Go directly to Lobster Pot, do not pass Set Sail", action: 'go_to_lobster_pot', data: {} },
  { id: 12, type: 'tide', text: 'Reef maintenance required. Pay 25 Shells per Outpost, 100 Shells per Fortress', action: 'pay_per_building', data: { perOutpost: 25, perFortress: 100 } },
  { id: 13, type: 'tide', text: 'Speeding through a no-swim zone. Pay 15 Shells', action: 'pay', data: { amount: 15 } },
  { id: 14, type: 'tide', text: "Hitch a ride on Poseidon's Current. If you pass Set Sail, collect 200 Shells", action: 'move_to_collect', data: { position: 5, collect: 200 } },
  { id: 15, type: 'tide', text: "You've been crowned Tide Master. Pay each player 50 Shells", action: 'pay_each', data: { amount: 50 } },
  { id: 16, type: 'tide', text: 'Your pearl farm yields profits. Collect 150 Shells', action: 'collect', data: { amount: 150 } },
];

const TREASURE_CHEST_CARDS: Card[] = [
  { id: 1, type: 'treasure_chest', text: 'The current carries you to Set Sail! Collect 200 Shells', action: 'move_to_collect', data: { position: 0, collect: 200 } },
  { id: 2, type: 'treasure_chest', text: 'Sunken treasure found! The reef bank awards you 200 Shells', action: 'collect', data: { amount: 200 } },
  { id: 3, type: 'treasure_chest', text: "Sea doctor's fee. Pay 50 Shells", action: 'pay', data: { amount: 50 } },
  { id: 4, type: 'treasure_chest', text: 'Sold rare seashells at the market. Collect 50 Shells', action: 'collect', data: { amount: 50 } },
  { id: 5, type: 'treasure_chest', text: 'Escape the Lobster Pot Free card', action: 'escape_lobster_pot', data: {} },
  { id: 6, type: 'treasure_chest', text: 'Trapped by a giant clam! Go directly to Lobster Pot, do not pass Set Sail', action: 'go_to_lobster_pot', data: {} },
  { id: 7, type: 'treasure_chest', text: 'Migration season bonus. Receive 100 Shells', action: 'collect', data: { amount: 100 } },
  { id: 8, type: 'treasure_chest', text: 'Coral tax refund. Collect 20 Shells', action: 'collect', data: { amount: 20 } },
  { id: 9, type: 'treasure_chest', text: "It's your hatching day! Collect 10 Shells from every player", action: 'collect_from_each', data: { amount: 10 } },
  { id: 10, type: 'treasure_chest', text: 'Deep sea salvage pays off. Collect 100 Shells', action: 'collect', data: { amount: 100 } },
  { id: 11, type: 'treasure_chest', text: 'Pay the sea witch 100 Shells for healing', action: 'pay', data: { amount: 100 } },
  { id: 12, type: 'treasure_chest', text: 'Reef school tuition. Pay 50 Shells', action: 'pay', data: { amount: 50 } },
  { id: 13, type: 'treasure_chest', text: 'Navigation consulting fee. Receive 25 Shells', action: 'collect', data: { amount: 25 } },
  { id: 14, type: 'treasure_chest', text: 'Reef repair assessment. 40 Shells per Outpost, 115 Shells per Fortress', action: 'pay_per_building', data: { perOutpost: 40, perFortress: 115 } },
  { id: 15, type: 'treasure_chest', text: 'Second place in the Great Reef Race! Collect 10 Shells', action: 'collect', data: { amount: 10 } },
  { id: 16, type: 'treasure_chest', text: 'Ancient treasure inheritance. Collect 100 Shells', action: 'collect', data: { amount: 100 } },
];
