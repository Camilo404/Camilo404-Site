export interface Profile {
  user?: User;
  connected_accounts?: ConnectedAccount[];
  premium_since?: Date;
  premium_type?: number;
  premium_guild_since?: Date;
  profile_themes_experiment_bucket?: number;
  user_profile?: UserProfile;
  badges?: Badge[];
  guild_badges?: any[];
  mutual_guilds?: MutualGuild[];
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
  metadata?: Metadata;
}

export interface Metadata {
  created_at?: Date;
  game_count?: string;
  item_count_dota2?: string;
  item_count_tf2?: string;
}

export interface MutualGuild {
  id?: string;
  nick?: null | string;
}

export interface User {
  id?: string;
  username?: string;
  global_name?: string;
  avatar?: string;
  discriminator?: string;
  public_flags?: number;
  flags?: number;
  banner?: string;
  banner_color?: null;
  accent_color?: null;
  bio?: string;
  avatar_decoration?: null;
}

export interface UserProfile {
  bio?: string;
  accent_color?: null;
  pronouns?: string;
  banner?: string;
  theme_colors?: number[];
  popout_animation_particle_type?: null;
  emoji?: null;
}
