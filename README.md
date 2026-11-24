# Shaheen TV 📺

Live Sports & Entertainment streaming app with country-wise channels.

## Features
- 🌍 Country-wise channels (Pakistan, India, Saudi Arabia, etc.)
- 🔍 Live search
- 🏷️ Category filters (Sports, News, Movies, Music, Kids, Religious…)
- 📱 Mobile-friendly sticky player
- ⚡ HLS.js streaming support
- 💾 Last country remembered in localStorage
- ⚙️ All images & links editable in `config.js`

## 🔧 How to Change Images & Links

**Edit ONLY `config.js`** — no need to touch other files!

| What to change | Edit in config.js |
|---|---|
| Splash logo | `images.splashLogo` |
| Player watermark | `images.watermarkLogo` |
| Player background | `images.playerBackground` |
| WhatsApp channel link | `links.whatsappChannel` |
| Splash duration (ms) | `settings.splashDuration` |
| Default country | `settings.defaultCountry` |

## 🚀 Deploy to Vercel

1. Create a GitHub repo
2. Upload all 6 files: `index.html`, `style.css`, `app.js`, `config.js`, `vercel.json`, `README.md`
3. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
4. Framework: **Other** (no build needed)
5. Click **Deploy** — done ✅

Any future change: edit `config.js` → commit → Vercel auto-deploys.

## Local Testing
Open `index.html` in browser (needs internet for API + HLS.js CDN).
