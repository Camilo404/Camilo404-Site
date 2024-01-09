export interface Lanyard {
  op?: number;
  d?: D;
  t?: string;
}

export interface D {
  kv?: Kv;
  spotify?: null;
  discord_user?: DiscordUser;
  activities?: Activity[];
  discord_status?: string;
  active_on_discord_web?: boolean;
  active_on_discord_desktop?: boolean;
  active_on_discord_mobile?: boolean;
  listening_to_spotify?: boolean;
}

export interface Activity {
  id?: string;
  name?: string;
  type?: number;
  session_id?: string;
  details?: string;
  state?: string;
  timestamps?: Timestamps;
  application_id?: string;
  assets?: Assets;
  sync_id?: string;
  created_at?: number;
  buttons?: string[];
}

export interface Assets {
  large_image?: string;
  large_text?: string;
  small_image?: string;
  small_text?: string;
}

export interface Timestamps {
  start?: any;
}

export interface DiscordUser {
  id?: string;
  username?: string;
  avatar?: string;
  discriminator?: string;
  bot?: boolean;
  global_name?: string;
  avatar_decoration_data?: AvatarDecorationData;
  display_name?: string;
  public_flags?: number;
}

export interface AvatarDecorationData {
  asset?: string;
  sku_id?: number;
}

export interface Kv {
}
