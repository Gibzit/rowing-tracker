# Pete Plan Rowing Tracker

A mobile-first Progressive Web App (PWA) for tracking the 24-week Pete Plan beginner rowing (erg) training program.

## Features

- All 24 weeks of sessions with coaching descriptions
- Check off completed sessions
- Log pace (mm:ss per 500m), total session time, and individual interval splits
- Optional sessions (Days 4 & 5) hidden by default with per-week toggle
- Progress tracking (core sessions completed out of 72)
- All data persisted in localStorage
- Works offline after first load (PWA with service worker)
- Installable on mobile home screen

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Production Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click "New Project" and import your repository
4. Vercel auto-detects Vite — just click "Deploy"
5. Your app will be live at `https://your-project.vercel.app`

## Deploy to Netlify

1. Push your code to a GitHub repository
2. Go to [netlify.com](https://netlify.com) and sign in with GitHub
3. Click "New site from Git" and select your repository
4. Set build command: `npm run build`
5. Set publish directory: `dist`
6. Click "Deploy"

## Deploy to GitHub Pages

1. Install the deploy plugin: `npm install -D gh-pages`
2. Add to `vite.config.ts`: `base: '/<repo-name>/'`
3. Add script to `package.json`: `"deploy": "gh-pages -d dist"`
4. Run: `npm run build && npm run deploy`

## Add to Your Phone Home Screen

### iPhone / iPad (Safari)
1. Open the deployed URL in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

### Android (Chrome)
1. Open the deployed URL in Chrome
2. Tap the three-dot menu
3. Tap "Add to Home screen" or "Install app"
4. Tap "Add"

The app will then work like a native app, including offline support.

## Tech Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- vite-plugin-pwa (Workbox)
