/**
 * Single source of truth for Discord CDN URL shapes.
 * Keep every `cdn.discordapp.com` / `media.discordapp.net` path here so a host
 * or format change lands in one place.
 */
const CDN = 'https://cdn.discordapp.com';
const MEDIA = 'https://media.discordapp.net';

export const DiscordCdn = {
  avatarDecoration(asset: string): string {
    return `${CDN}/avatar-decoration-presets/${asset}.png`;
  },

  clanBadge(guildId: string, badge: string, size = 32): string {
    return `${CDN}/clan-badges/${guildId}/${badge}.png?size=${size}`;
  },

  nameplate(asset: string): string {
    return `${CDN}/assets/collectibles/${asset}asset.webm`;
  },

  appAsset(applicationId: string, image: string): string {
    return `${CDN}/app-assets/${applicationId}/${image}.png`;
  },

  emoji(id: string, animated = false, query = ''): string {
    return `${CDN}/emojis/${id}.${animated ? 'gif' : 'png'}${query}`;
  },

  /** Rewrites Discord's `mp:external/...` proxy refs to a fetchable media URL. */
  externalMedia(ref: string): string {
    return ref.replace('mp:external/', `${MEDIA}/external/`);
  },
};
