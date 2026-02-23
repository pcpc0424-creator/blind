# Bulag Mobile App (Capacitor)

This document explains how to build and deploy the Bulag mobile app for iOS and Android.

## Prerequisites

### For Android
- Android Studio (latest version)
- Android SDK (API 22+)
- Java JDK 17+

### For iOS
- macOS with Xcode 15+
- Apple Developer account (for App Store deployment)
- CocoaPods (`sudo gem install cocoapods`)

## Project Structure

```
apps/web/
├── android/          # Android native project
├── ios/              # iOS native project
├── capacitor.config.ts   # Capacitor configuration
└── out/              # Web assets (placeholder)
```

## Development Workflow

### 1. Sync Changes
After making changes to the web app or Capacitor config:

```bash
cd apps/web
npm run cap:sync
```

### 2. Open in IDE

**Android:**
```bash
npm run cap:open:android
# or
npx cap open android
```

**iOS:**
```bash
npm run cap:open:ios
# or
npx cap open ios
```

## Building for Release

### Android APK/AAB

1. Open Android Studio: `npm run cap:open:android`
2. Go to **Build > Generate Signed Bundle / APK**
3. Create or select a keystore
4. Choose **Android App Bundle (AAB)** for Play Store or **APK** for direct distribution
5. Select **release** build variant
6. Build

### iOS IPA

1. Open Xcode: `npm run cap:open:ios`
2. Select your team in **Signing & Capabilities**
3. Go to **Product > Archive**
4. In Organizer, click **Distribute App**
5. Choose distribution method (App Store, Ad Hoc, etc.)

## App Icons

### Android
Replace icons in: `android/app/src/main/res/mipmap-*`

Required sizes:
- mipmap-mdpi: 48x48
- mipmap-hdpi: 72x72
- mipmap-xhdpi: 96x96
- mipmap-xxhdpi: 144x144
- mipmap-xxxhdpi: 192x192

### iOS
Replace icons in Xcode:
1. Open `ios/App/App/Assets.xcassets/AppIcon.appiconset`
2. Replace icons with your designs

Required sizes: 20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024 (various @1x, @2x, @3x)

## Splash Screen

### Android
Replace images in: `android/app/src/main/res/drawable-*`
- splash.png files in portrait and landscape folders

### iOS
1. Open Xcode
2. Go to `ios/App/App/Assets.xcassets/Splash.imageset`
3. Replace splash images

## Push Notifications Setup

### Android (Firebase)
1. Create Firebase project at https://console.firebase.google.com
2. Add Android app with package name `com.bulagph.app`
3. Download `google-services.json`
4. Place in `android/app/google-services.json`

### iOS (APNs)
1. Enable Push Notifications in Apple Developer account
2. Create APNs key or certificate
3. Configure in Xcode under **Signing & Capabilities > Push Notifications**

## Configuration

Edit `capacitor.config.ts` to change:
- `appId`: Bundle/Package identifier
- `appName`: Display name
- `server.url`: Backend URL (current: https://bulagph.com/blind)
- Plugin settings (splash screen, status bar, etc.)

## Useful Commands

```bash
# Sync web assets and plugins
npm run cap:sync

# Copy web assets only
npm run cap:copy

# Open Android Studio
npm run cap:open:android

# Open Xcode
npm run cap:open:ios
```

## Troubleshooting

### Android: Gradle sync failed
```bash
cd android && ./gradlew clean
```

### iOS: Pod install failed
```bash
cd ios/App && pod install --repo-update
```

### Clear Capacitor cache
```bash
npx cap sync --force
```
