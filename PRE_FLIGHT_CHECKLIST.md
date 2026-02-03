
# ✈️ Pre-Flight Checklist - Run Before Deployment

## 🔍 Final Verification (5 minutes)

Run these checks before submitting to app stores:

### 1. Code Quality ✅
```bash
# Check for linting errors
npm run lint
```
**Expected**: No errors

### 2. Test on Real Devices ✅
- [ ] Test on physical iPhone (iOS 13+)
- [ ] Test on physical Android phone (Android 6.0+)
- [ ] Test on web browser (Chrome, Safari, Firefox)

### 3. Game Functionality ✅
- [ ] Game starts correctly
- [ ] Tap to jump works anywhere on screen
- [ ] Collision detection is accurate
- [ ] Score increments correctly
- [ ] High score saves and persists after app restart
- [ ] Game over screen displays correctly
- [ ] "Play Again" button works
- [ ] Dark mode switches properly
- [ ] No crashes during gameplay

### 4. Performance ✅
- [ ] Game runs at 60 FPS
- [ ] No lag or stuttering
- [ ] Smooth animations
- [ ] Fast app startup (< 3 seconds)
- [ ] No memory leaks (play for 5+ minutes)

### 5. Visual Check ✅
- [ ] App icon displays correctly
- [ ] Splash screen shows properly
- [ ] Capybara character renders correctly
- [ ] Pipes render correctly
- [ ] Clouds animate smoothly
- [ ] Ground displays properly
- [ ] Score is visible and readable
- [ ] UI looks good in light mode
- [ ] UI looks good in dark mode

### 6. Cross-Platform Check ✅
- [ ] iOS: Test on iPhone 12+ and iPad
- [ ] Android: Test on Samsung/Pixel device
- [ ] Web: Test on desktop and mobile browsers

### 7. Build Configuration ✅
```bash
# Verify app.json settings
cat app.json | grep -E "name|slug|version|bundleIdentifier|package"
```

**Expected output:**
```json
"name": "Flappybara",
"slug": "flappybara",
"version": "1.0.0",
"bundleIdentifier": "com.cronplay.flappybara",
"package": "com.cronplay.flappybara"
```

### 8. Dependencies ✅
```bash
# Check for outdated critical dependencies
npm outdated
```

### 9. Storage Permissions ✅
- [ ] AsyncStorage works on iOS
- [ ] AsyncStorage works on Android
- [ ] High score persists after force-quit
- [ ] High score persists after device restart

### 10. Error Handling ✅
- [ ] App doesn't crash on low memory
- [ ] App handles storage errors gracefully
- [ ] App recovers from game loop errors

## 🚀 Build Test (15 minutes)

### Test Production Builds

**iOS:**
```bash
# Build for iOS
npm run eas:build:ios

# Wait for build to complete (~15 min)
# Download and install on test device
# Test thoroughly
```

**Android:**
```bash
# Build for Android
npm run eas:build:android

# Wait for build to complete (~15 min)
# Download and install on test device
# Test thoroughly
```

**Web:**
```bash
# Build for web
npm run build:web

# Test locally
npx serve dist

# Open http://localhost:3000
# Test thoroughly
```

## 📱 Store Assets Ready ✅

### iOS App Store
- [ ] App icon (1024x1024)
- [ ] Screenshots:
  - [ ] 6.7" iPhone (1290 x 2796) - at least 3
  - [ ] 6.5" iPhone (1242 x 2688) - at least 3
  - [ ] 5.5" iPhone (1242 x 2208) - at least 3
  - [ ] iPad Pro (2048 x 2732) - at least 2
- [ ] App description written
- [ ] Keywords selected
- [ ] Privacy policy URL (if needed)
- [ ] Support URL
- [ ] Marketing URL (optional)

### Google Play Store
- [ ] App icon (512x512)
- [ ] Feature graphic (1024 x 500)
- [ ] Screenshots:
  - [ ] Phone (1080 x 1920) - at least 2
  - [ ] 7" Tablet (1200 x 1920) - at least 2
  - [ ] 10" Tablet (1600 x 2560) - at least 2
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Promotional video (optional)
- [ ] Privacy policy URL (if needed)

## 🔐 Developer Accounts ✅

### Apple Developer
- [ ] Account created ($99/year)
- [ ] Payment method added
- [ ] App ID created in Developer Portal
- [ ] App created in App Store Connect
- [ ] Certificates and profiles configured

### Google Play Developer
- [ ] Account created ($25 one-time)
- [ ] Payment method added
- [ ] App created in Play Console
- [ ] Content rating completed
- [ ] Target audience selected

## 📄 Legal Documents ✅

- [ ] Privacy policy created (even if no data collected)
- [ ] Terms of service created (optional)
- [ ] Age rating determined (4+ / Everyone)
- [ ] Content rating completed

## 🎯 Final Checks

### Before Submission
- [ ] All tests passed
- [ ] No known bugs
- [ ] Performance is optimal
- [ ] Store assets uploaded
- [ ] Descriptions written
- [ ] Keywords optimized
- [ ] Privacy policy linked
- [ ] Developer accounts ready

### Submission Checklist
- [ ] iOS build uploaded to App Store Connect
- [ ] Android build uploaded to Play Console
- [ ] Web version deployed
- [ ] All store information filled
- [ ] Screenshots uploaded
- [ ] Descriptions finalized
- [ ] Ready to submit for review

## ✅ All Clear for Takeoff!

If all items above are checked, you're ready to deploy! 🚀

### Deploy Commands

**iOS:**
```bash
npm run eas:submit:ios
```

**Android:**
```bash
npm run eas:submit:android
```

**Web:**
```bash
npm run deploy:web:vercel
```

---

**Good luck with your launch! 🎮🚀**
