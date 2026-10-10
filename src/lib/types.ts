export interface Decision {
  id: string;
  title: string;
  options: string[];
  creator_token: string;
  spun: boolean;
  spun_at: string | null;
  winner_index: number | null;
  winner_choice: string | null;
  created_at: string;
}

export interface ClientDecision {
  id: string;
  title: string;
  spun: boolean;
  spun_at: string | null;
  winner_index: number | null;
  winner_choice: string | null;
  created_at: string;
  // If not spun and not creator, options is hidden and optionCount is provided
  options?: string[];
  optionCount: number;
  isCreator?: boolean;
}

export interface CreateDecisionPayload {
  title: string;
  options: string[];
}

export interface SpinResult {
  winner_index: number;
  winner_choice: string;
  options: string[];
  spun_at: string;
  already_spun?: boolean;
}
