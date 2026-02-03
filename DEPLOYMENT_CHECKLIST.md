
# 🚀 Flappybara Deployment Checklist

## Pre-Deployment Verification

### ✅ Code Quality
- [x] No console errors in development
- [x] All TypeScript types are properly defined
- [x] No linting errors (`npm run lint`)
- [x] Game physics are balanced and fun
- [x] High score persistence works correctly
- [x] Dark mode support implemented
- [x] Cross-platform compatibility verified

### ✅ Assets
- [x] App icon is properly configured (26a0cb07-896d-4e69-809c-a0af20358a05.webp)
- [x] Splash screen is configured
- [x] Capybara character image is included
- [x] All assets are optimized for size

### ✅ Configuration Files
- [x] `app.json` is properly configured
- [x] `eas.json` is set up for builds
- [x] Bundle identifiers are unique
- [x] Version numbers are set (1.0.0)

## iOS Deployment

### 1. Apple Developer Account Setup
- [ ] Create/login to Apple Developer account ($99/year)
- [ ] Create App ID in Apple Developer Portal
  - Bundle ID: `com.cronplay.flappybara`
- [ ] Create provisioning profiles
- [ ] Set up App Store Connect

### 2. App Store Connect Configuration
- [ ] Create new app in App Store Connect
- [ ] Fill in app information:
  - Name: Flappybara
  - Subtitle: Tap to Fly!
  - Category: Games > Casual
  - Age Rating: 4+
- [ ] Upload screenshots (required sizes):
  - 6.7" iPhone: 1290 x 2796
  - 6.5" iPhone: 1242 x 2688
  - 5.5" iPhone: 1242 x 2208
  - iPad Pro: 2048 x 2732
- [ ] Write app description
- [ ] Add keywords for ASO
- [ ] Set privacy policy URL (if applicable)

### 3. Build and Submit
```bash
# Login to EAS
eas login

# Configure project (if not done)
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### 4. App Review
- [ ] Submit for review
- [ ] Monitor review status
- [ ] Respond to any feedback
- [ ] Release when approved

## Android Deployment

### 1. Google Play Console Setup
- [ ] Create Google Play Developer account ($25 one-time fee)
- [ ] Create new app in Play Console
- [ ] Set up app details:
  - App name: Flappybara
  - Category: Games > Casual
  - Content rating: Everyone

### 2. Store Listing
- [ ] Upload screenshots (required):
  - Phone: 1080 x 1920 (minimum 2 screenshots)
  - 7" Tablet: 1200 x 1920
  - 10" Tablet: 1600 x 2560
- [ ] Upload feature graphic: 1024 x 500
- [ ] Upload app icon: 512 x 512
- [ ] Write short description (80 characters max)
- [ ] Write full description (4000 characters max)
- [ ] Add promotional video (optional)

### 3. Build and Submit
```bash
# Build for Android (AAB format for Play Store)
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android
```

### 4. Release Management
- [ ] Choose release track (Internal/Closed/Open/Production)
- [ ] Set up staged rollout (recommended: start with 20%)
- [ ] Monitor crash reports and reviews
- [ ] Gradually increase rollout percentage

## Web Deployment

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Build web version
npm run build:web

# Deploy
vercel deploy --prod
```

### Option 2: Netlify
1. Build: `npm run build:web`
2. Drag and drop `dist` folder to Netlify
3. Configure custom domain (optional)

### Option 3: GitHub Pages
```bash
# Build
npm run build:web

# Deploy to gh-pages branch
npx gh-pages -d dist
```

## Post-Deployment

### Monitoring
- [ ] Set up analytics (optional):
  - Google Analytics
  - Firebase Analytics
  - Amplitude
- [ ] Monitor crash reports:
  - Sentry
  - Crashlytics
- [ ] Track user reviews and ratings
- [ ] Monitor app performance metrics

### Marketing
- [ ] Create social media accounts
- [ ] Share on Product Hunt
- [ ] Post on Reddit (r/gaming, r/IndieGaming)
- [ ] Create promotional video
- [ ] Reach out to gaming influencers
- [ ] Submit to app review sites

### Updates
- [ ] Plan regular updates
- [ ] Fix bugs reported by users
- [ ] Add new features based on feedback
- [ ] Optimize performance
- [ ] Update for new OS versions

## App Store Optimization (ASO)

### Keywords (iOS)
- flappy bird
- casual game
- capybara
- tap game
- arcade game
- endless runner
- high score
- addictive game

### Keywords (Android)
Include in description:
- Flappy Bird style game
- Cute capybara character
- Casual arcade game
- Tap to fly
- Beat your high score
- Free offline game
- No ads (if applicable)

## Legal Requirements

### Privacy Policy
- [ ] Create privacy policy (even if you don't collect data)
- [ ] Host on website or GitHub Pages
- [ ] Link in app stores

### Terms of Service
- [ ] Create terms of service (optional but recommended)
- [ ] Include in app or link in stores

### Age Rating
- **iOS**: 4+ (No objectionable content)
- **Android**: Everyone (ESRB)

## Testing Checklist

### Before Submission
- [ ] Test on multiple iOS devices/simulators
- [ ] Test on multiple Android devices/emulators
- [ ] Test on web browsers (Chrome, Safari, Firefox)
- [ ] Test in both light and dark mode
- [ ] Verify high score persistence
- [ ] Test game physics and collision detection
- [ ] Verify all buttons and interactions work
- [ ] Check for memory leaks
- [ ] Test app icon and splash screen
- [ ] Verify app doesn't crash on startup

### Performance
- [ ] Game runs at 60 FPS
- [ ] No frame drops during gameplay
- [ ] Smooth animations
- [ ] Fast app startup time
- [ ] Low memory usage

## Version Management

### Current Version: 1.0.0

### Future Updates
- 1.0.1: Bug fixes
- 1.1.0: New features (power-ups, different characters)
- 1.2.0: Multiplayer mode
- 2.0.0: Major redesign

## Support

### User Support Channels
- [ ] Set up support email
- [ ] Create FAQ page
- [ ] Monitor app store reviews
- [ ] Respond to user feedback

## Success Metrics

### Track These KPIs
- Downloads/Installs
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Average session length
- Retention rate (Day 1, Day 7, Day 30)
- Average high score
- Crash-free rate
- App store rating

## Emergency Procedures

### If Critical Bug Found
1. Acknowledge the issue publicly
2. Fix the bug immediately
3. Submit expedited review (iOS) or staged rollout (Android)
4. Communicate with affected users

### If App Rejected
1. Read rejection reason carefully
2. Fix the issue
3. Respond to reviewer with explanation
4. Resubmit for review

---

**Good luck with your deployment! 🚀**
