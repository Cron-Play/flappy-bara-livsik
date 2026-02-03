
# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### Build Issues

#### ❌ "No project ID found in app.json"
**Solution:**
```bash
eas build:configure
```
This will create a project on Expo servers and add the project ID to your `app.json`.

#### ❌ iOS Build Fails: "No valid code signing identity"
**Solution:**
1. Ensure you have an Apple Developer account
2. Run: `eas credentials`
3. Select "iOS" → "Set up new credentials"
4. Follow the prompts to create certificates

#### ❌ Android Build Fails: "Keystore not found"
**Solution:**
```bash
eas credentials
```
Select "Android" → "Set up new keystore"

#### ❌ "Build failed with exit code 1"
**Solution:**
1. Check the build logs on expo.dev
2. Look for specific error messages
3. Common fixes:
   - Update dependencies: `npm update`
   - Clear cache: `npm run clean` (if available)
   - Rebuild: `eas build --clear-cache`

### Runtime Issues

#### ❌ Game is Laggy/Stuttering
**Possible Causes:**
1. **Device is low on memory**
   - Close other apps
   - Restart device
   
2. **Too many background processes**
   - Check Activity Monitor (iOS) or Developer Options (Android)
   
3. **Debug mode is enabled**
   - Ensure you're testing production builds
   - Debug mode is slower

**Solution:**
```bash
# Build production version
npm run eas:build:ios --profile production
npm run eas:build:android --profile production
```

#### ❌ High Score Not Saving
**Possible Causes:**
1. **AsyncStorage not installed**
   ```bash
   npm install @react-native-async-storage/async-storage
   ```

2. **Storage permissions denied (Android)**
   - Check app permissions in device settings
   - Reinstall the app

3. **Storage quota exceeded (Web)**
   - Clear browser storage
   - Check browser console for errors

**Debug:**
```javascript
// Add to game.tsx temporarily
console.log('Saving high score:', score);
console.log('Loaded high score:', highScore);
```

#### ❌ App Crashes on Startup
**Possible Causes:**
1. **Missing assets**
   - Verify capybara image exists: `assets/images/52b1c166-be40-4bd1-be77-9f6625ab8726.png`
   - Verify app icon exists: `assets/images/26a0cb07-896d-4e69-809c-a0af20358a05.webp`

2. **Incompatible dependencies**
   ```bash
   # Reinstall dependencies
   rm -rf node_modules
   npm install
   ```

3. **Corrupted build**
   ```bash
   # Clean and rebuild
   eas build --clear-cache
   ```

#### ❌ Collision Detection Too Sensitive/Not Sensitive Enough
**Solution:**
Adjust `COLLISION_MARGIN` in `app/game.tsx`:
```typescript
// Current value (forgiving)
const collisionMargin = 5;

// More forgiving (easier)
const collisionMargin = 10;

// Less forgiving (harder)
const collisionMargin = 2;
```

#### ❌ Game Too Fast/Too Slow
**Solution:**
Adjust game constants in `app/game.tsx`:
```typescript
// Make game easier (slower)
const GRAVITY = 0.3;        // Lower = slower fall
const JUMP_VELOCITY = -7;   // Lower = gentler jump
const PIPE_SPEED = 1.2;     // Lower = slower pipes

// Make game harder (faster)
const GRAVITY = 0.5;        // Higher = faster fall
const JUMP_VELOCITY = -10;  // Higher = stronger jump
const PIPE_SPEED = 2.0;     // Higher = faster pipes
```

### Deployment Issues

#### ❌ App Store Rejection: "Missing Privacy Policy"
**Solution:**
1. Create a simple privacy policy (even if you don't collect data)
2. Host it on GitHub Pages or your website
3. Add URL to App Store Connect

**Template:**
```
Privacy Policy for Flappybara

This app does not collect, store, or share any personal information.
All game data (high scores) is stored locally on your device.

Contact: your-email@example.com
```

#### ❌ App Store Rejection: "App Crashes on Launch"
**Solution:**
1. Test on the EXACT iOS version mentioned in rejection
2. Check crash logs in App Store Connect
3. Fix the issue and resubmit

#### ❌ Google Play Rejection: "Missing Content Rating"
**Solution:**
1. Go to Play Console → Content Rating
2. Complete the questionnaire
3. Select "Everyone" rating
4. Resubmit

#### ❌ "Submission Failed: Invalid Bundle Identifier"
**Solution:**
Verify bundle IDs match in:
- `app.json` → `ios.bundleIdentifier`
- `app.json` → `android.package`
- App Store Connect / Play Console

Should be: `com.cronplay.flappybara`

### Web Deployment Issues

#### ❌ Web Build Fails
**Solution:**
```bash
# Clear cache and rebuild
rm -rf dist
npm run build:web
```

#### ❌ "Cannot find module" on Web
**Solution:**
Check that all imports use correct paths:
```typescript
// ✅ Correct
import { Image } from 'react-native';

// ❌ Wrong
import { Image } from 'react-native-web';
```

#### ❌ Web Version Doesn't Load
**Possible Causes:**
1. **Missing index.html**
   - Check `dist` folder after build
   
2. **Incorrect base path**
   - For GitHub Pages, update `app.json`:
   ```json
   "web": {
     "bundler": "metro",
     "output": "static",
     "publicPath": "/flappybara/"
   }
   ```

3. **CORS issues**
   - Ensure assets are served from same domain

### Performance Issues

#### ❌ Memory Leak (App Gets Slower Over Time)
**Solution:**
The game already has proper cleanup, but verify:
```typescript
// In game.tsx, cleanup is handled in useEffect
useEffect(() => {
  return () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    if (pipeGenerationTimer.current) {
      clearInterval(pipeGenerationTimer.current);
    }
  };
}, []);
```

#### ❌ Battery Drain
**Possible Causes:**
1. **Game loop running when app is backgrounded**
   - Already handled with proper cleanup
   
2. **Too many re-renders**
   - Game uses `useSharedValue` to avoid re-renders
   
3. **High FPS on low-end devices**
   - Consider adaptive FPS based on device performance

### Testing Issues

#### ❌ Can't Install on iOS Device
**Solution:**
1. **For development builds:**
   ```bash
   eas build --profile development --platform ios
   ```
   Install Expo Go and scan QR code

2. **For production builds:**
   - Use TestFlight
   - Or use ad-hoc provisioning profile

#### ❌ Can't Install on Android Device
**Solution:**
1. Enable "Install from Unknown Sources" in device settings
2. Download APK (not AAB) for direct installation:
   ```bash
   eas build --profile preview --platform android
   ```

### Debug Tools

#### Enable Debug Logging
Add to `app/game.tsx`:
```typescript
// At the top of the file
const DEBUG = true;

// Replace console.log with:
if (DEBUG) console.log('Debug message');
```

#### Check AsyncStorage
```typescript
// Add temporarily to test storage
import AsyncStorage from '@react-native-async-storage/async-storage';

const checkStorage = async () => {
  const keys = await AsyncStorage.getAllKeys();
  console.log('Storage keys:', keys);
  
  const highScore = await AsyncStorage.getItem('@flappybara_high_score');
  console.log('Stored high score:', highScore);
};
```

#### Monitor Performance
```typescript
// Add to game loop
const startTime = Date.now();
// ... game logic ...
const endTime = Date.now();
if (endTime - startTime > 16) {
  console.warn('Frame took too long:', endTime - startTime, 'ms');
}
```

## Getting Help

### Resources
- **Expo Docs**: https://docs.expo.dev
- **Expo Forums**: https://forums.expo.dev
- **Expo Discord**: https://chat.expo.dev
- **React Native Docs**: https://reactnative.dev

### Before Asking for Help
1. Check this troubleshooting guide
2. Search Expo forums for similar issues
3. Check the build logs on expo.dev
4. Try the solution on a clean device/emulator

### When Asking for Help, Include:
- Exact error message
- Platform (iOS/Android/Web)
- Device/OS version
- Steps to reproduce
- Build logs (if applicable)
- Code snippet (if relevant)

---

**Still having issues? Check the Expo documentation or reach out on Discord!**
