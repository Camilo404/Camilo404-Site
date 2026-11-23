// GET /og.png — the link-preview card Discord (and others) show when the URL
// is pasted: avatar, live status and what I'm listening to / playing.
// Rendered with satori + resvg (og_edge) on every cache miss.

import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.6/mod.ts';
import type { Config } from 'https://edge.netlify.com';
import { getPresence, Presence, STATUS } from './lib/presence.ts';

const W = 1200;
const H = 630;

// ---------- Tiny element helper (satori takes React-like objects; no React needed) ----------
type Style = Record<string, string | number>;
type Child = El | string | null | false;
interface El {
  type: string;
  props: Record<string, unknown> & { style?: Style; children?: Child | Child[] };
}
function h(type: string, props: Record<string, unknown> & { style?: Style }, ...children: Child[]): El {
  const kids = children.filter((c) => c !== null && c !== false);
  return { type, props: { ...props, children: kids.length === 1 ? kids[0] : kids } };
}
const div = (style: Style, ...children: Child[]) => h('div', { style: { display: 'flex', ...style } }, ...children);

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

// ---------- Fonts (TTF from Google Fonts, cached per isolate) ----------
const fontCache = new Map<string, Promise<ArrayBuffer>>();
function googleFont(family: string, weight: number): Promise<ArrayBuffer> {
  const key = `${family}:${weight}`;
  if (!fontCache.has(key)) {
    fontCache.set(
      key,
      (async () => {
        // Without a browser user agent the CSS API answers with TrueType URLs
        const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family.replaceAll(' ', '+')}:wght@${weight}`)).text();
        const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
        if (!url) throw new Error(`No TTF for ${key}`);
        return (await fetch(url)).arrayBuffer();
      })(),
    );
  }
  return fontCache.get(key)!;
}

// ---------- Card ----------
function card(p: Presence): El {
  const status = STATUS[p.status];
  const a = p.activity;

  const label =
    a?.kind === 'spotify' ? 'LISTENING ON SPOTIFY' : a?.kind === 'game' ? 'PLAYING' : a?.kind === 'custom' ? 'STATUS' : 'ABOUT ME';
  const title = a ? clip(a.title, 34) : 'Web Developer';
  const subtitle = a?.kind === 'spotify' || a?.kind === 'game' ? clip(a.subtitle, 48) : a ? '' : 'Medellín, Colombia';

  return div(
    {
      width: W,
      height: H,
      padding: 56,
      fontFamily: 'Geist',
      background: 'linear-gradient(135deg, #e6d9fd 0%, #fbe0ee 52%, #d9e9fc 100%)',
      position: 'relative',
    },
    // Soft pastel blobs
    div({ position: 'absolute', top: -160, left: -120, width: 520, height: 520, borderRadius: 9999, background: 'radial-gradient(circle, rgba(201,179,251,0.75), rgba(201,179,251,0) 70%)' }),
    div({ position: 'absolute', bottom: -200, right: -140, width: 600, height: 600, borderRadius: 9999, background: 'radial-gradient(circle, rgba(245,179,208,0.7), rgba(245,179,208,0) 70%)' }),
    div({ position: 'absolute', bottom: -180, left: 260, width: 460, height: 460, borderRadius: 9999, background: 'radial-gradient(circle, rgba(201,239,223,0.7), rgba(201,239,223,0) 70%)' }),

    // Glass card
    div(
      {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 56px',
        borderRadius: 44,
        background: 'rgba(255,255,255,0.72)',
        border: '2px solid rgba(255,255,255,0.95)',
        boxShadow: '0 30px 70px -24px rgba(110,80,160,0.35)',
      },

      // Identity row
      div(
        { alignItems: 'center', gap: 40 },
        div(
          { position: 'relative', width: 184, height: 184 },
          h('img', {
            src: p.avatarUrl,
            width: 184,
            height: 184,
            style: { borderRadius: 9999, border: '7px solid #ffffff', boxShadow: '0 12px 30px -10px rgba(110,80,160,0.5)' },
          }),
          div({
            position: 'absolute',
            right: 4,
            bottom: 4,
            width: 46,
            height: 46,
            borderRadius: 9999,
            background: status.color,
            border: '8px solid #ffffff',
          }),
        ),
        div(
          { flexDirection: 'column', flex: 1 },
          div({ fontFamily: 'Fredoka', fontSize: 88, fontWeight: 600, color: '#2d2640', lineHeight: 1 }, clip(p.name, 16)),
          div({ fontSize: 34, color: '#766c8b', marginTop: 10 }, `@${p.username}`),
          div(
            { marginTop: 20, alignItems: 'center', gap: 12, alignSelf: 'flex-start', padding: '8px 22px', borderRadius: 9999, background: '#ffffff' },
            div({ width: 16, height: 16, borderRadius: 9999, background: status.color }),
            div({ fontFamily: 'Fredoka', fontSize: 28, fontWeight: 600, color: '#2d2640' }, status.label),
          ),
        ),
        div({ alignSelf: 'flex-start', fontFamily: 'Fredoka', fontSize: 28, fontWeight: 600, color: '#7a5fd0' }, 'camilo404.dev'),
      ),

      // Activity panel
      div(
        {
          alignItems: 'center',
          gap: 30,
          padding: 24,
          borderRadius: 30,
          background: 'rgba(255,255,255,0.8)',
          border: '2px solid rgba(255,255,255,1)',
        },
        a?.kind === 'spotify'
          ? h('img', { src: a.imageUrl, width: 128, height: 128, style: { borderRadius: 20, boxShadow: '0 10px 24px -10px rgba(45,38,64,0.5)' } })
          : div(
              { width: 128, height: 128, borderRadius: 20, background: 'linear-gradient(135deg, #dccdfc, #fbd3e4)', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fredoka', fontSize: 56, fontWeight: 600, color: '#ffffff' },
              a?.kind === 'game' ? '▶' : '404',
            ),
        div(
          { flexDirection: 'column', flex: 1, minWidth: 0 },
          div({ fontSize: 22, fontWeight: 600, letterSpacing: 4, color: '#7a5fd0' }, label),
          div({ fontFamily: 'Fredoka', fontSize: 50, fontWeight: 600, color: '#2d2640', marginTop: 6, lineHeight: 1.1 }, title),
          subtitle ? div({ fontSize: 30, color: '#544a68', marginTop: 6 }, subtitle) : null,
        ),
      ),
    ),
  );
}

export default async (): Promise<Response> => {
  const [presence, fredoka, geist, geistBold] = await Promise.all([
    getPresence(),
    googleFont('Fredoka', 600),
    googleFont('Geist', 400),
    googleFont('Geist', 600),
  ]);

  const image = new ImageResponse(card(presence) as never, {
    width: W,
    height: H,
    fonts: [
      { name: 'Fredoka', data: fredoka, weight: 600, style: 'normal' },
      { name: 'Geist', data: geist, weight: 400, style: 'normal' },
      { name: 'Geist', data: geistBold, weight: 600, style: 'normal' },
    ],
  });

  // Short cache: previews should feel live, but a burst of crawlers shouldn't re-render
  const headers = new Headers(image.headers);
  headers.set('Cache-Control', 'public, max-age=60');
  headers.set('Netlify-CDN-Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
  return new Response(image.body, { status: image.status, headers });
};

export const config: Config = { path: '/og.png', cache: 'manual' };
