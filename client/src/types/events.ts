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
  | 'game:lobster_pot_in'
  | 'game:lobster_pot_out'
  | 'game:bankrupt'
  | 'game:set_sail_bonus'
  | 'game:turn_end'
  | 'game:finished'
  | 'room:player_joined'
  | 'room:player_disconnected'
  | 'room:player_reconnected';

export interface WSMessage {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}
