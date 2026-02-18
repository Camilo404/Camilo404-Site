export interface Profile {
  user?: User;
  connected_accounts?: ConnectedAccount[];
  premium_since?: string;
  premium_type?: number;
  premium_guild_since?: string;
  profile_themes_experiment_bucket?: number;
  user_profile?: UserProfile;
  badges?: Badge[];
  guild_badges?: any[];
  mutual_guilds?: MutualGuild[];
  widgets?: any[];
  legacy_username?: string;
}

export interface Badge {
  id?: string;
  description?: string;
  icon?: string;
  link?: string;
}

export interface ConnectedAccount {
  type?: string;
  id?: string;
  name?: string;
  verified?: boolean;
}

export interface MutualGuild {
  id?: string;
  nick?: string | null;
}

export interface User {
  id?: string;
  username?: string;
  global_name?: string;
  avatar?: string;
  avatar_decoration_data?: AvatarDecorationData;
  collectibles?: Collectibles;
  discriminator?: string;
  display_name_styles?: any;
  public_flags?: number;
  primary_guild?: PrimaryGuild;
  clan?: Clan;
  flags?: number;
  banner?: string;
  banner_color?: string;
  accent_color?: number;
  bio?: string;
}

export interface AvatarDecorationData {
  asset?: string;
  sku_id?: string;
  expires_at?: string | null;
}

export interface Collectibles {
  nameplate?: Nameplate;
}

export interface Nameplate {
  asset?: string;
  palette?: string;
  label?: string;
  sku_id?: string;
  expires_at?: string | null;
}

export interface PrimaryGuild {
  identity_guild_id?: string;
  identity_enabled?: boolean;
  tag?: string;
  badge?: string;
}

export interface Clan {
  identity_guild_id?: string;
  identity_enabled?: boolean;
  tag?: string;
  badge?: string;
}

export interface UserProfile {
  bio?: string;
  accent_color?: number | null;
  pronouns?: string;
  profile_effect?: ProfileEffect;
  banner?: string;
  theme_colors?: number[];
  popout_animation_particle_type?: any;
  emoji?: any;
}

export interface ProfileEffect {
  id?: string;
  sku_id?: string;
  expires_at?: string | null;
}

// Profile Effect Config
export interface ProfileEffectConfig {
  type?: number;
  id?: string;
  sku_id?: string;
  title?: string;
  description?: string;
  accessibilityLabel?: string;
  animationType?: number;
  thumbnailPreviewSrc?: string;
  reducedMotionSrc?: string;
  effects?: ProfileEffectLayer[];
}

export interface ProfileEffectLayer {
  src?: string;
  loop?: boolean;
  height?: number;
  width?: number;
  duration?: number;
  start?: number;
  loopDelay?: number;
  position?: {
    x?: number;
    y?: number;
  };
  zIndex?: number;
  randomizedSources?: Array<{ src?: string }>;
}

export interface ProfileEffectsResponse {
  profile_effect_configs?: ProfileEffectConfig[];
}
