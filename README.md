
# 🎮 Flappybara

A fun and addictive Flappy Bird-style game featuring a cute capybara! Built with React Native and Expo.

## 🌟 Features

- **Smooth Gameplay**: 60 FPS game loop with optimized physics
- **Persistent High Scores**: Your best score is saved locally using AsyncStorage
- **Dark Mode Support**: Automatically adapts to your device's theme
- **Cross-Platform**: Works on iOS, Android, and Web
- **Beautiful Graphics**: Custom capybara character with animated clouds
- **Forgiving Collision Detection**: Precise hitboxes for fair gameplay
- **Responsive Controls**: Tap anywhere on the screen to jump

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- Expo CLI
- For iOS: Xcode and iOS Simulator
- For Android: Android Studio and Android Emulator

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

### Running the App

**Development Mode:**
```bash
npm run dev
# or
pnpm dev
```

**iOS:**
```bash
npm run ios
# or
pnpm ios
```

**Android:**
```bash
npm run android
# or
pnpm android
```

**Web:**
```bash
npm run web
# or
pnpm web
```

## 📦 Building for Production

### Using EAS Build (Recommended)

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure your project:**
   ```bash
   eas build:configure
   ```

4. **Build for iOS:**
   ```bash
   eas build --platform ios --profile production
   ```

5. **Build for Android:**
   ```bash
   eas build --platform android --profile production
   ```

### Building Locally

**iOS (requires macOS):**
```bash
npm run build:android
npx expo run:ios --configuration Release
```

**Android:**
```bash
npm run build:android
npx expo run:android --variant release
```

**Web:**
```bash
npm run build:web
```

## 🎯 Deployment

### iOS App Store

1. Build the production iOS app using EAS Build
2. Download the `.ipa` file
3. Upload to App Store Connect using Transporter or Xcode
4. Submit for review

### Google Play Store

1. Build the production Android app using EAS Build (AAB format)
2. Download the `.aab` file
3. Upload to Google Play Console
4. Complete the store listing and submit for review

### Web Deployment

The web build can be deployed to any static hosting service:

- **Vercel**: `vercel deploy`
- **Netlify**: Drag and drop the `dist` folder
- **GitHub Pages**: Push the `dist` folder to `gh-pages` branch
- **Firebase Hosting**: `firebase deploy`

## 🎮 How to Play

1. Tap **Start Game** to begin
2. Tap anywhere on the screen to make the capybara jump
3. Avoid hitting the pipes or the ground
4. Try to beat your high score!

## 🛠️ Technical Details

### Game Physics
- **Gravity**: 0.4 (reduced for smoother gameplay)
- **Jump Velocity**: -8 (gentle jumps)
- **Pipe Speed**: 1.5 (slower for easier gameplay)
- **Collision Margin**: 5px (forgiving hitboxes)

### Performance Optimizations
- 60 FPS game loop using `setInterval`
- Reanimated 2 for smooth animations
- Efficient collision detection
- Cloud parallax scrolling at 30 FPS
- Optimized pipe generation and cleanup

### Technologies Used
- **React Native**: Cross-platform mobile framework
- **Expo**: Development and build tooling
- **React Native Reanimated**: High-performance animations
- **React Native Gesture Handler**: Touch gesture handling
- **AsyncStorage**: Persistent local storage
- **TypeScript**: Type-safe development

## 📱 App Store Information

### App Name
Flappybara

### Bundle Identifiers
- **iOS**: `com.cronplay.flappybara`
- **Android**: `com.cronplay.flappybara`

### Version
1.0.0

### Privacy
This app does not collect any user data. All game progress is stored locally on your device.

## 🐛 Troubleshooting

### Build Issues

**iOS Build Fails:**
- Ensure you have the latest Xcode installed
- Run `pod install` in the `ios` folder
- Clear build cache: `npx expo prebuild --clean`

**Android Build Fails:**
- Ensure Android SDK is properly installed
- Check Java version (should be JDK 17)
- Clear Gradle cache: `cd android && ./gradlew clean`

### Runtime Issues

**Game is laggy:**
- Close other apps to free up memory
- Restart the app
- On web, try a different browser (Chrome recommended)

**High score not saving:**
- Check device storage permissions
- Ensure AsyncStorage is properly installed
- Try reinstalling the app

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Inspired by the classic Flappy Bird game
- Capybara character design
- Built with love using Expo and React Native

## 📞 Support

For issues, questions, or feedback, please open an issue on GitHub.

---

**Enjoy playing Flappybara! 🎮🦫**
