# Camilo404 Personal Website

A modern, immersive personal portfolio built with **Angular 21** that fuses **Glassmorphism**, **Anime aesthetics**, and **Real-time Data**. It showcases a dynamic Discord profile and interactive widgets.

## 🌟 Key Features

### 🔮 Core Experience
- **Dynamic Discord Profile Card**: Real-time integration via Lanyard WebSocket API showing status, activities, Spotify listening, badges, profile effects, and clan tags.
- **Bento Grid Layout**: A modern, responsive grid architecture that organizes widgets elegantly.
- **Glassmorphism UI**: Frosted glass effects with sophisticated blurring and transparency.
- **Dark / Light Mode**: Smooth theme transitions using the View Transitions API.

### 🧩 Interactive Widgets
- **Shadow Terminal**: An aesthetic widget featuring a typewriter effect that cycles through iconic quotes (e.g., *The Eminence in Shadow*).
- **Tech Stack Marquee**: An infinite scrolling loop displaying your technology stack with hover glow effects.
- **Clock**: A stylized digital clock with visual effects.
- **Social Connect**: A consolidated hub for all your social media links.

### 🎵 Spotify Integration
- **Live Activity Panel**: Floating widget showing the current Spotify track with album art, progress bar, and elapsed time.
- **Synced Lyrics**: Real-time lyrics synchronized to playback position via [lrclib.net](https://lrclib.net).
- **Dynamic Theming**: Background and accent colors extracted from the album art using `fast-average-color`.

### 🎨 Visual & Fun Elements
- **Ethereal Background**: Subtle animated noise and shadow effects that give depth to the page.
- **3D Card Tilt Effect**: Mouse/touch-driven perspective tilt on the profile card and widgets.
- **Profile Effects**: Animated Discord profile effect layers rendered in real time.
- **Cursor Interaction**:
  - **Custom Cursor**: Replaces the default pointer for better immersion.
  - **Oneko (Cat)**: A pixel-art cat that chases your cursor across the screen.
- **Profile Search**: Built-in modal to search and view other Discord profiles.

## 📋 Tech Stack

| Category | Technology |
|---|---|
| Framework | Angular 21 (Standalone Components, Signals) |
| Styling | SCSS, Tailwind CSS v3 |
| APIs | Lanyard WebSocket, Discord Assets, lrclib.net |
| Icons | Font Awesome 6 |
| Color Extraction | fast-average-color |
| Build | Angular CLI + Vite/esbuild |

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Camilo404/Camilo404-Site.git
   cd Camilo404-Site
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Open `src/environments/environment.ts` and set your Discord ID:
   ```typescript
   export const environment = {
     production: false,
     discordId: "YOUR_DISCORD_ID",       // Your 18-digit Discord User ID
     apiUrl: "YOUR_BACKEND_API_URL/v1/", // Backend proxy for Discord API
     webSocketUrl: "wss://api.lanyard.rest/socket"
   };
   ```

4. **Run Development Server**
   ```bash
   npm start
   ```
   Navigate to `http://localhost:4200/`.

5. **Production Build**
   ```bash
   npm run build:prod
   ```

## 🏗️ Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── models/
│   │   │   ├── discord-profile.model.ts   # Discord API response types
│   │   │   └── lanyard-profile.model.ts   # Lanyard WebSocket types
│   │   └── services/
│   │       ├── card-3d-effect.service.ts          # 3D tilt effect with listener cleanup
│   │       ├── discord-api.service.ts             # Discord profile HTTP client
│   │       ├── lanyard.service.ts                 # WebSocket + reconnect logic
│   │       ├── lyrics.service.ts                  # lrclib.net lyrics fetcher
│   │       ├── profile-effect-animation.service.ts # Profile effect layer timers
│   │       ├── profile-effects.service.ts         # Discord profile effects cache
│   │       └── timestamps.service.ts              # Elapsed time / progress observables
│   ├── features/
│   │   └── home/
│   │       ├── components/
│   │       │   ├── ethereal-shadow/   # Background noise/shadow effects
│   │       │   └── neko/              # Pixel-art cursor cat
│   │       ├── pages/
│   │       │   └── home-page/         # Bento grid layout
│   │       └── widgets/
│   │           ├── clock-widget/      # Stylized digital clock
│   │           ├── shadow-widget/     # Typewriter quote terminal
│   │           ├── social-widget/     # Social media links
│   │           └── tech-stack-widget/ # Infinite tech stack marquee
│   └── shared/
│       ├── pipes/
│       │   ├── bio-formatter.pipe.ts  # Discord bio → safe HTML (Markdown + emoji)
│       │   └── status-color.pipe.ts   # discord_status → CSS hex color
│       ├── services/
│       │   └── theme.service.ts       # Dark/light mode with View Transitions API
│       └── ui/
│           ├── card-profile/          # Main Discord profile card
│           ├── floating-activity/     # Spotify / game activity panel
│           └── theme-toggle/          # Dark/light toggle button
└── assets/
    └── images/
        └── connections/               # Service icons (SVG)
```

## 🔧 Customization

### Changing your Discord ID
Edit `src/environments/environment.ts`:
```typescript
export const environment = {
  discordId: "YOUR_DISCORD_ID",
  // ...
};
```

### Updating the Tech Stack
Navigate to `src/app/features/home/widgets/tech-stack-widget/` and modify the tech stack array in the component.

### Changing Quotes (Shadow Widget)
In `src/app/features/home/widgets/shadow-widget/`, update the `quotes` array to personalize the typewriter text.

### Adding Social Links
In `src/app/features/home/widgets/social-widget/`, add entries to the social links array.

## 🧱 Architecture Notes

- **Standalone Components** throughout — no NgModules.
- **Angular Signals** for reactive state (`signal`, `computed`, `effect`).
- **`takeUntilDestroyed`** + `Subject`-based cancellation for all RxJS subscriptions.
- **`ProfileEffectAnimationService`** manages all profile effect `setTimeout` references and cancels them on destroy.
- **`Card3DEffectService`** stores `renderer.listen` unlisten functions per element and releases them via `destroyCard3DEffect`.
- **`BioFormatterPipe`** and **`StatusColorPipe`** are pure standalone pipes — zero component logic for presentation transforms.

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">
  <p>Built with 💜 by Camilo404</p>
</div>
