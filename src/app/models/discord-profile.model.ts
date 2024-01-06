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
  nick?: null;
}

export interface User {
  id?: string;
  username?: string;
  global_name?: string;
  avatar?: string;
  avatar_decoration_data?: AvatarDecorationData;
  discriminator?: string;
  public_flags?: number;
  flags?: number;
  banner?: string;
  banner_color?: null;
  accent_color?: null;
  bio?: string;
}

export interface AvatarDecorationData {
  asset?: string;
  sku_id?: string;
}

export interface UserProfile {
  bio?: string;
  accent_color?: null;
  pronouns?: string;
  profile_effect?: ProfileEffect;
  banner?: string;
  theme_colors?: number[];
  popout_animation_particle_type?: null;
  emoji?: null;
}

export interface ProfileEffect {
  id?: string;
}
