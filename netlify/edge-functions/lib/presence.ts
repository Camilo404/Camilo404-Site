// Live Discord presence (via Lanyard), trimmed to what link previews need.

export const DISCORD_ID = '201796217292718080';
export const SITE = 'https://camilo404.dev';

export type DiscordStatus = 'online' | 'idle' | 'dnd' | 'offline';

export interface Presence {
  name: string;
  username: string;
  avatarUrl: string;
  status: DiscordStatus;
  /** What I'm doing right now, most interesting first */
  activity:
    | { kind: 'spotify'; title: string; subtitle: string; imageUrl: string }
    | { kind: 'game'; title: string; subtitle: string }
    | { kind: 'custom'; title: string }
    | null;
}

export const STATUS: Record<DiscordStatus, { label: string; color: string; emoji: string }> = {
  online: { label: 'Online', color: '#3ba55d', emoji: '🟢' },
  idle: { label: 'Away', color: '#f0b232', emoji: '🌙' },
  dnd: { label: 'Do not disturb', color: '#f23f43', emoji: '⛔' },
  offline: { label: 'Offline', color: '#80848e', emoji: '💤' },
};

const FALLBACK: Presence = {
  name: '404',
  username: 'camilo404',
  avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png',
  status: 'offline',
  activity: null,
};

// deno-lint-ignore no-explicit-any
type Json = any;

/** Fetches presence from Lanyard; never throws, falls back to a neutral card. */
export async function getPresence(): Promise<Presence> {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return FALLBACK;
    const { data }: { data: Json } = await res.json();
    const user = data.discord_user;

    let activity: Presence['activity'] = null;
    const game = (data.activities as Json[]).find((a) => a.type === 0);
    const custom = (data.activities as Json[]).find((a) => a.type === 4 && a.state);
    if (data.listening_to_spotify && data.spotify) {
      activity = {
        kind: 'spotify',
        title: data.spotify.song,
        subtitle: String(data.spotify.artist).replaceAll('; ', ', '),
        imageUrl: data.spotify.album_art_url,
      };
    } else if (game) {
      activity = { kind: 'game', title: game.name, subtitle: game.details ?? game.state ?? '' };
    } else if (custom) {
      activity = { kind: 'custom', title: custom.state };
    }

    return {
      name: user.global_name ?? user.username,
      username: user.username,
      avatarUrl: user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
        : FALLBACK.avatarUrl,
      status: data.discord_status ?? 'offline',
      activity,
    };
  } catch {
    return FALLBACK;
  }
}

/** One-line summary for og:description. */
export function describe(p: Presence): string {
  const a = p.activity;
  if (a?.kind === 'spotify') return `🎵 Listening to ${a.title} by ${a.subtitle}`;
  if (a?.kind === 'game') return `🎮 Playing ${a.title}${a.subtitle ? ` · ${a.subtitle}` : ''}`;
  if (a?.kind === 'custom') return `💬 ${a.title}`;
  const s = STATUS[p.status];
  return p.status === 'offline' ? `${s.emoji} Offline right now · Web Developer` : `${s.emoji} ${s.label} on Discord · Web Developer`;
}
