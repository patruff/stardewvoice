# Stardew Voice - Web App

Voice-enabled Progressive Web App for tracking Stardew Valley Community Center bundles.

## 🚀 Live Demo

Access the app at: **[Your GitHub Pages URL will appear here after deployment]**

## ✨ Features

- **🎤 Voice Recognition**: Built-in Web Speech API (no API key required!)
- **📱 Progressive Web App**: Install to home screen like a native app
- **💾 Offline Support**: Works without internet connection
- **🔄 Auto-sync**: Progress saved automatically in browser
- **⚡ Instant Updates**: Push code → Auto-deploy → Refresh browser
- **🌍 Cross-platform**: Works on Android, iOS, desktop

## 🎙️ Voice Commands

### Track Items
- "Caught the Catfish"
- "I caught a Parsnip"
- "Caught Gold Quality Melon"

### Check What's Needed
- "What do I need for Spring?"
- "Anything else needed for Summer?"
- "What's needed for Fall 12?"

### View Progress
- "Show progress"
- "Bundle progress"

### Reset
- "Reset"
- "Start over"

## 📱 How to Install as PWA

### On Android (Chrome/Edge):
1. Open the web app in Chrome
2. Tap the menu (⋮) → "Install app" or "Add to Home Screen"
3. The app icon will appear on your home screen
4. Launch like a native app!

### On iOS (Safari):
1. Open the web app in Safari
2. Tap the Share button (□↑)
3. Scroll and tap "Add to Home Screen"
4. Tap "Add" in the top right

### On Desktop:
1. Open in Chrome/Edge
2. Click the install icon (➕) in the address bar
3. Click "Install"

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (no frameworks needed!)
- **Voice**: Web Speech API (built into modern browsers)
- **Storage**: LocalStorage for progress tracking
- **PWA**: Service Worker for offline support
- **Deployment**: GitHub Pages (auto-deploy on push)

## 🔧 Local Development

```bash
# Clone the repository
git clone <repo-url>
cd stardewvoice/web

# Serve locally (any HTTP server works)
python -m http.server 8000
# or
npx serve

# Open in browser
open http://localhost:8000
```

## 🚀 Deployment

**Automatic Deployment:**
- Push to the branch triggers auto-deploy to GitHub Pages
- Live in ~30 seconds
- No build process required!

**Manual Deploy:**
1. Go to Actions → Deploy to GitHub Pages
2. Click "Run workflow"
3. Wait ~30 seconds
4. App is live!

## 📊 Bundle Data

The app tracks all Community Center bundles:

- **Pantry** (6 bundles): Crops, Quality Crops, Animal, Artisan
- **Fish Tank** (6 bundles): River, Lake, Ocean, Night, Specialty, Crab Pot
- **Crafts Room** (6 bundles): Seasonal Foraging, Construction, Exotic
- **Boiler Room** (3 bundles): Blacksmith, Geologist, Adventurer
- **Bulletin Board** (5 bundles): Chef, Dye, Field Research, Fodder, Enchanter
- **Vault** (4 bundles): Gold bundles (2,500g - 25,000g)

Each item includes:
- Available seasons
- Difficulty rating (1-4 stars)
- Special conditions (weather, time, location)
- Quality requirements

## 🎯 Browser Compatibility

**Voice Recognition:**
- ✅ Chrome (Android & Desktop)
- ✅ Edge (Android & Desktop)
- ✅ Safari (iOS 14.5+, limited)
- ❌ Firefox (not yet supported)

**PWA Support:**
- ✅ Chrome/Edge (all platforms)
- ✅ Safari (iOS 11.3+)
- ✅ Samsung Internet

## 🔒 Privacy

- All data stored locally in your browser
- No analytics or tracking
- No external API calls (except browser's speech recognition)
- No account or login required

## 📝 Development Workflow

1. **Edit files** in `/web` directory
2. **Test locally** with any HTTP server
3. **Push to GitHub**
4. **Auto-deploys** to GitHub Pages in ~30 seconds
5. **Refresh browser** on your phone to see changes

## 🐛 Troubleshooting

**Voice not working?**
- Ensure you're using Chrome/Edge/Safari
- Check microphone permissions in browser settings
- Try HTTPS (required for Web Speech API)

**Can't install as PWA?**
- Must be served over HTTPS (GitHub Pages does this automatically)
- Check browser compatibility above
- Try the "Add to Home Screen" option in browser menu

**Progress not saving?**
- Check browser storage settings
- Ensure cookies/storage is enabled
- Try clearing cache and refreshing

## 🤝 Contributing

This is a simple single-page app. To contribute:

1. Edit files in `/web` directory
2. Test locally
3. Submit pull request
4. Auto-deploys on merge!

## 📄 License

MIT License - feel free to use and modify!

## ⚠️ Disclaimer

This is an unofficial fan-made app. Stardew Valley is created by ConcernedApe.
