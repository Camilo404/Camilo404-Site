# Camilo404 Personal Website

![Banner](https://media.discordapp.net/attachments/914640467516350475/1078335706616844388/3517019.gif?ex=67f29be2&is=67f14a62&hm=a3f785fd2dea4d9d792f231b8932b73eb4b5a39e3468ccb073698d1dc1cadf18&=&width=1032&height=469)

A modern, interactive personal website built with Angular that showcases your profile, social media links, real-time Discord status, and more.

## 🌟 Features

- **Dynamic Discord Profile Card** - Shows your Discord profile information and real-time status via Lanyard API
- **Background Video** - Customizable video background with control options
- **Social Media Integration** - Easily add and display your social media profiles
- **Interactive Elements** - Including:
  - Custom cursor
  - Oneko (cat) animation that follows cursor movement
  - Animated clock
- **Responsive Design** - Optimized for both desktop and mobile devices

## 📋 Prerequisites

- Node.js 16.x or higher
- Angular CLI 17.x

## 🚀 Installation

1. Clone the repository
   ```bash
   git clone https://github.com/Camilo404/Camilo404-Site.git
   cd Camilo404-Site
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure environment variables
   - Open `src/environments/environment.ts` and update:
     ```typescript
     export const environment = {
       "discordId": "YOUR_DISCORD_ID",
       "apiUrl": "YOUR_API_URL",
       "webSocketUrl": "wss://api.lanyard.rest/socket"
     };
     ```

4. Run the development server
   ```bash
   npm start
   ```

5. Navigate to `http://localhost:4200/`

## 🏗️ Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── card-profile/       # Discord profile card component
│   │   ├── clock/              # Animated clock component
│   │   ├── main/               # Main page with video background
│   │   ├── neko/               # Animated cat that follows cursor
│   │   └── profile-viewer/     # Profile viewer page
│   ├── models/                 # TypeScript interfaces
│   ├── services/               # API services
│   └── app.component.*         # Root component
├── assets/
│   ├── images/                 # Site images
│   └── videos/                 # Background videos
└── environments/               # Environment configuration
```

## 🔧 Customization

### Changing the Discord Profile

Update your Discord ID in the environment file to display your own profile information:

```typescript
// src/environments/environment.ts
export const environment = {
  "discordId": "YOUR_DISCORD_ID",
  // ...
};
```

### Adding Social Media Links

Modify the social media links in `main.component.html`:

```html
<section class="glowing-icons">
  <ul class="flex flex-wrap gap-2">
    <li>
      <a href="YOUR_LINK" target="_blank" class="hovered">
        <i class="fa-brands fa-ICON_NAME"></i>
      </a>
    </li>
    <!-- Add more social media links -->
  </ul>
</section>
```

### Changing Background Video

Replace the video file in `src/assets/videos/` and update the reference in `main.component.html`.

## 📱 Features In Detail

### Discord Card

The Discord card displays your:
- Profile picture with Discord status
- Username and global name
- Profile badges
- Bio with Markdown support
- Current activity (including Spotify with progress bar)
- Connected accounts

### Interactive Elements

- **Custom Cursor**: Replaces the standard cursor with a custom design
- **Oneko (Cat Animation)**: A small pixelated cat that follows your cursor around the screen
- **Animated Clock**: A stylized clock with glitch effects
- **Snowfall Effect**: Animated snowflakes on the profile page
- **3D Card Effect**: Custom 3D hover effect for cards using CSS transforms

## 🛠️ Technologies Used

- Angular 17
- TypeScript
- Tailwind CSS
- Lanyard API (for Discord status)
- RxJS

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Acknowledgements

- [Discord Markdown Parser](https://github.com/SrGobi/discord-markdown-fix) - For rendering Discord Markdown
- [Lanyard API](https://github.com/Phineas/lanyard) - For real-time Discord status
