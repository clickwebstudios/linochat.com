export interface FrubixConfig {
  url?: string;
  client_id?: string;
  client_secret?: string;
  connected?: boolean;
  connected_at?: string;
  enabled?: boolean;
}

export interface FrubixIntegration {
  enabled?: boolean;
  url?: string;
  connected_at?: string;
}
