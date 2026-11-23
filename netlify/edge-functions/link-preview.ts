// Link-preview crawlers (Discord, Telegram, X…) don't run JavaScript, so they
// only see index.html's static tags. For them, swap in live ones: a fresh
// /og.png card, a description of what I'm doing, and an embed colour that
// matches my Discord status. Regular visitors get the page untouched.

import type { Config, Context } from 'https://edge.netlify.com';
import { describe, getPresence, SITE, STATUS } from './lib/presence.ts';

const CRAWLERS = /discordbot|twitterbot|telegrambot|slackbot|whatsapp|facebookexternalhit|linkedinbot|embedly|skypeuripreview|redditbot|mastodon|bluesky|vkshare|pinterest/i;

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export default async (request: Request, context: Context): Promise<Response> => {
  if (!CRAWLERS.test(request.headers.get('user-agent') ?? '')) return context.next();

  const [response, presence] = await Promise.all([context.next(), getPresence()]);
  if (!response.headers.get('content-type')?.includes('text/html')) return response;

  // Changes every minute, so Discord re-fetches the image instead of reusing an old card
  const image = `${SITE}/og.png?v=${Math.floor(Date.now() / 60_000)}`;
  const title = `${presence.name} (@${presence.username})`;
  const description = describe(presence);
  const color = STATUS[presence.status].color;

  const tags = [
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="camilo404.dev">`,
    `<meta property="og:url" content="${SITE}${new URL(request.url).pathname}">`,
    `<meta property="og:title" content="${escape(title)}">`,
    `<meta property="og:description" content="${escape(description)}">`,
    `<meta property="og:image" content="${image}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escape(title)}">`,
    `<meta name="twitter:description" content="${escape(description)}">`,
    `<meta name="twitter:image" content="${image}">`,
    // Discord paints the embed's side bar with this
    `<meta name="theme-color" content="${color}">`,
  ].join('\n  ');

  const html = (await response.text())
    // Drop the static preview tags, then add the live ones
    .replace(/<meta (?:property|name)="(?:og:[^"]+|twitter:[^"]+|theme-color|description)"[^>]*>\s*/g, '')
    .replace('</head>', `\n  <meta name="description" content="${escape(description)}">\n  ${tags}\n</head>`);

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.set('Cache-Control', 'no-store');
  return new Response(html, { status: response.status, headers });
};

export const config: Config = { path: ['/', '/homelab'] };
