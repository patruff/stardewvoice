# Quick Deploy Guide

## Fastest Way to Test on Your Phone

### Method 1: GitHub Actions (Recommended)

1. **Push your changes** to the branch `claude/stardew-voice-bundle-tracker-iJm1q`

2. **Go to GitHub Actions** in your repository
   - Click on "Actions" tab
   - You'll see two workflows: "Android CI - Build APK" and "Quick Deploy to Device"

3. **Trigger Quick Deploy** (Manual)
   - Click on "Quick Deploy to Device" workflow
   - Click "Run workflow" button
   - Wait 2-3 minutes for build to complete

4. **Download APK to Your Phone**
   - Scroll to the bottom of the workflow run
   - Click on "Artifacts"
   - Download `StardewVoice-[timestamp].zip`
   - Extract the APK on your phone
   - Install it (you may need to enable "Install from Unknown Sources")

### Method 2: Automatic on Every Push

Every time you push to the branch, GitHub Actions will automatically:
- Build the APK
- Upload it as an artifact
- Keep it for 30 days

Just go to the Actions tab → Click latest run → Download artifact

### Method 3: Use GitHub Releases

Create a git tag to automatically create a release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This will create a GitHub Release with the APK attached that you can download directly without artifacts.

### Method 4: Direct APK Download Link (Advanced)

If you want even faster deployment, you can:

1. Set up **Firebase App Distribution** (free)
   - Add your email/phone
   - Get APK pushed directly to your device
   - Requires Firebase setup

2. Set up **AppCenter** distribution
   - Similar to Firebase
   - Microsoft's solution

## Installing APK on Your Phone

### Android Installation Steps:

1. Download the APK file to your phone
2. Open your phone's Settings
3. Go to Security → Install Unknown Apps
4. Allow your browser/file manager to install apps
5. Tap the APK file to install
6. Grant microphone permissions when prompted

### Scanning from Computer:

If the workflow generates a QR code (future enhancement), you can:
1. Run the workflow
2. Scan the QR code with your phone
3. Download APK directly

## Troubleshooting

**Build fails?**
- Check the GitHub Actions logs
- Make sure all Gradle files are committed
- Verify Java version (JDK 17 required)

**Can't install APK?**
- Enable "Install from Unknown Sources" in Android settings
- Make sure it's not blocked by Google Play Protect
- Try downloading again if file is corrupted

**Permissions issues?**
- Go to Settings → Apps → Stardew Voice → Permissions
- Enable Microphone permission

## Quick Commands

```bash
# Check current branch
git branch

# Push latest changes
git add .
git commit -m "Update features"
git push

# Create release tag
git tag v1.0.1
git push origin v1.0.1

# View GitHub Actions status
gh run list  # requires GitHub CLI
```

## Build Times

- First build: ~3-5 minutes
- Subsequent builds: ~2-3 minutes (cached dependencies)
- Download: ~5-10 seconds (APK is ~5-10 MB)

## Next Steps

For even faster iteration:
1. Use Firebase App Distribution → APK pushed to phone automatically
2. Set up GitHub Releases → Direct download links
3. Use ngrok + local builds → Instant testing (requires local Android Studio)
