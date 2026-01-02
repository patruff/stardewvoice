# Quick Start - Web App Deployment

## Enable GitHub Pages (One-Time Setup)

1. **Go to your GitHub repository**
2. **Click "Settings"** (top navigation)
3. **Click "Pages"** (left sidebar)
4. **Under "Source"**, select:
   - Source: **GitHub Actions**
5. **Save** (if prompted)

That's it! The workflow will automatically deploy on the next push.

## First Deployment

The web app will deploy automatically when you:
- Push to your branch
- Or manually trigger via Actions tab

### Manual Trigger:
1. Go to **Actions** tab
2. Click **Deploy to GitHub Pages**
3. Click **Run workflow**
4. Wait ~30 seconds

## Your Live URL

After deployment, your app will be available at:

```
https://[your-username].github.io/stardewvoice/
```

Or check the Actions tab → Latest workflow run → Deployment URL

## Testing on Your Phone

### Quick Test (No Install):
1. Open the URL on your phone's browser (Chrome recommended)
2. Grant microphone permission
3. Tap "Tap to Speak"
4. Say: "Caught the Catfish"
5. See it added to your bundle!

### Install as App:
1. Open the URL in Chrome (Android) or Safari (iOS)
2. **Android**: Tap menu (⋮) → "Install app"
3. **iOS**: Tap Share (□↑) → "Add to Home Screen"
4. App icon appears on home screen
5. Launch like a native app!

## Development Workflow

**Super Fast Testing:**

```bash
# 1. Make changes to files in /web directory
vim web/app.js

# 2. Commit and push
git add web/
git commit -m "Update voice recognition"
git push

# 3. Wait ~30 seconds

# 4. Refresh browser on your phone
# Changes are LIVE!
```

**Total time from code change to testing: ~30-45 seconds!**

## Common Voice Commands to Test

```
"Caught the Catfish"
"Caught a Parsnip"
"What do I need for Spring?"
"What do I need for Summer?"
"Show progress"
```

## Troubleshooting

### Pages not deploying?
- Check Actions tab for errors
- Ensure GitHub Pages is enabled (Settings → Pages)
- Make sure branch is pushed to GitHub

### Voice not working?
- Must use HTTPS (GitHub Pages provides this automatically)
- Grant microphone permission in browser
- Use Chrome on Android or Safari on iOS (best support)
- Firefox doesn't support Web Speech API yet

### App not updating?
- Hard refresh: Ctrl+Shift+R (desktop) or clear browser cache
- Service worker might cache old version
- Check if latest deployment succeeded in Actions tab

## File Structure

```
web/
├── index.html          # Main app page
├── app.js              # Voice recognition & bundle logic
├── styles.css          # Styling
├── bundles.json        # All bundle data
├── manifest.json       # PWA manifest
├── service-worker.js   # Offline support
└── icon.svg            # App icon
```

## Making Changes

**Want to change the UI?**
- Edit `web/index.html` and `web/styles.css`

**Want to change voice logic?**
- Edit `web/app.js`

**Want to add/modify bundles?**
- Edit `web/bundles.json`

**All changes auto-deploy on push!**

## Comparing with Android

| Feature | Web App | Android App |
|---------|---------|-------------|
| Deploy Time | ~30 seconds | ~2-3 minutes |
| Installation | Optional (PWA) | Required (APK) |
| Updates | Instant refresh | Download + install |
| Platforms | All (Android/iOS/Desktop) | Android only |
| Voice API | Web Speech API (free) | Android SpeechRecognizer |
| Offline | Yes (service worker) | Yes (native) |
| **Best For** | Development & testing | Final release |

## Next Steps

1. Enable GitHub Pages (see above)
2. Wait for deployment
3. Open URL on your phone
4. Start tracking bundles!
5. Make changes and see them live in seconds!

## Questions?

- Check workflow status: Actions tab
- View deployment URL: Actions → Latest run → Deployment summary
- Test locally: `python -m http.server 8000` in `/web` directory
