// WebSocket message envelope
export interface WSMessage {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

// Server -> Spectator events
export type SpectatorEventType =
  | 'game:state'
  | 'game:started'
  | 'game:turn_start'
  | 'game:dice_rolled'
  | 'game:player_moved'
  | 'game:property_bought'
  | 'game:property_passed'
  | 'game:rent_paid'
  | 'game:tax_paid'
  | 'game:card_drawn'
  | 'game:outpost_built'
  | 'game:fortress_built'
  | 'game:building_sold'
  | 'game:mortgaged'
  | 'game:unmortgaged'
  | 'game:trade_proposed'
  | 'game:trade_accepted'
  | 'game:trade_rejected'
  | 'game:lobster_pot_in'
  | 'game:lobster_pot_out'
  | 'game:bankrupt'
  | 'game:set_sail_bonus'
  | 'game:turn_end'
  | 'game:finished'
  | 'room:player_joined'
  | 'room:player_disconnected'
  | 'room:player_reconnected';

// Server -> Agent events
export type AgentEventType =
  | 'agent:welcome'
  | 'agent:game_started'
  | 'agent:your_turn'
  | 'agent:buy_decision'
  | 'agent:build_decision'
  | 'agent:trade_received'
  | 'agent:lobster_pot_decision'
  | 'agent:must_raise_funds'
  | 'agent:game_over';

// Agent -> Server actions
export type AgentActionType =
  | 'action:roll_dice'
  | 'action:buy'
  | 'action:pass'
  | 'action:build'
  | 'action:sell_building'
  | 'action:mortgage'
  | 'action:unmortgage'
  | 'action:trade_offer'
  | 'action:trade_respond'
  | 'action:escape_pay'
  | 'action:escape_card'
  | 'action:escape_roll'
  | 'action:end_turn';

// Spectator -> Server commands
export type SpectatorCommandType =
  | 'spectator:set_speed'
  | 'spectator:pause'
  | 'spectator:resume'
  | 'spectator:next_turn';
