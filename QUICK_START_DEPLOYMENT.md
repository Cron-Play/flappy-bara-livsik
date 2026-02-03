
# 🚀 Quick Start: Deploy Flappybara in 5 Minutes

## Prerequisites
- Expo account (free): https://expo.dev/signup
- EAS CLI installed: `npm install -g eas-cli`

## Step 1: Login to Expo (30 seconds)
```bash
eas login
```

## Step 2: Configure Your Project (1 minute)
```bash
# This creates your project on Expo servers
eas build:configure
```

When prompted:
- Select "All" for platforms
- It will update your `app.json` with a project ID

## Step 3: Build for iOS (15 minutes)
```bash
eas build --platform ios --profile production
```

This will:
- Upload your code to Expo servers
- Build your iOS app in the cloud
- Give you a download link when complete

**Note**: First build takes ~15-20 minutes. Subsequent builds are faster.

## Step 4: Build for Android (15 minutes)
```bash
eas build --platform android --profile production
```

This will:
- Upload your code to Expo servers
- Build your Android app (AAB format for Play Store)
- Give you a download link when complete

## Step 5: Test Your Builds (5 minutes)

### iOS
- Download the `.ipa` file from the build link
- Install on a physical device using TestFlight or direct installation
- Test the game thoroughly

### Android
- Download the `.aab` or `.apk` file
- For APK: Install directly on device
- For AAB: Upload to Google Play Console internal testing

## Step 6: Submit to App Stores

### iOS App Store
```bash
eas submit --platform ios
```

You'll need:
- Apple Developer account ($99/year)
- App Store Connect app created
- Your Apple ID credentials

### Google Play Store
```bash
eas submit --platform android
```

You'll need:
- Google Play Developer account ($25 one-time)
- Play Console app created
- Service account JSON key

## Alternative: Build Locally (Advanced)

### iOS (macOS only)
```bash
npx expo prebuild
cd ios
pod install
cd ..
npx expo run:ios --configuration Release
```

### Android
```bash
npx expo prebuild
npx expo run:android --variant release
```

## Web Deployment (Instant)

### Option 1: Vercel (Recommended - 2 minutes)
```bash
# Install Vercel CLI
npm i -g vercel

# Build
npm run build:web

# Deploy
vercel deploy --prod
```

### Option 2: Netlify (Drag & Drop - 1 minute)
1. Run `npm run build:web`
2. Go to https://app.netlify.com/drop
3. Drag the `dist` folder
4. Done! Your game is live

### Option 3: GitHub Pages (5 minutes)
```bash
# Build
npm run build:web

# Deploy
npx gh-pages -d dist
```

## Troubleshooting

### "No project ID found"
Run `eas build:configure` first

### "Build failed"
Check the build logs on expo.dev for specific errors

### "Submission failed"
Ensure you have:
- Valid developer accounts
- Correct credentials
- Proper app configuration in store consoles

## What's Next?

After deployment:
1. ✅ Monitor crash reports
2. ✅ Respond to user reviews
3. ✅ Plan updates and new features
4. ✅ Market your game on social media

## Need Help?

- Expo Docs: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction/
- EAS Submit: https://docs.expo.dev/submit/introduction/

---

**Your game is ready to deploy! Good luck! 🎮🚀**
