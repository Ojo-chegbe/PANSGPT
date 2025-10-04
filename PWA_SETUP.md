# 📱 PWA Icon Setup Guide

This guide will help you set up proper PWA icons so that when users add PansGPT to their home screen, it shows your custom icon instead of just a "P".

## 🎯 What's Been Done

✅ **PWA Manifest Created**: `public/manifest.json` with proper configuration
✅ **Layout Updated**: `src/app/layout.tsx` with PWA metadata
✅ **Icon Generator**: `generate-icons.html` tool to create required icon sizes

## 📋 Steps to Complete Setup

### 1. Generate Required Icons

1. Open `generate-icons.html` in your web browser
2. Upload your existing `favicon.png` file
3. Download the generated icons:
   - `icon-192x192.png` (192x192 pixels)
   - `icon-512x512.png` (512x512 pixels) 
   - `apple-touch-icon.png` (180x180 pixels)

### 2. Save Icons to Public Folder

Place the downloaded icons in your `public/` folder:
```
public/
├── favicon.png (existing)
├── icon-192x192.png (new)
├── icon-512x512.png (new)
├── apple-touch-icon.png (new)
└── manifest.json (new)
```

### 3. Test PWA Functionality

1. Start your development server: `npm run dev`
2. Open your app in a mobile browser
3. Look for "Add to Home Screen" option
4. The app should now show your custom icon instead of "P"

## 🔧 Technical Details

### Manifest Configuration
- **App Name**: PansGPT - AI Academic Assistant
- **Short Name**: PansGPT
- **Theme Color**: #10b981 (Emerald green)
- **Background Color**: #111827 (Dark gray)
- **Display Mode**: Standalone (full-screen app)

### Icon Requirements
- **192x192**: Android home screen icon
- **512x512**: Android splash screen and high-res icon
- **180x180**: Apple touch icon for iOS

### Browser Support
- ✅ Chrome/Edge (Android)
- ✅ Safari (iOS)
- ✅ Firefox (Android)
- ✅ Samsung Internet

## 🎨 Icon Design Tips

- Use a square design that works well at small sizes
- Ensure good contrast against both light and dark backgrounds
- Keep details simple and recognizable
- Test on actual devices to ensure clarity

## 🚀 After Setup

Once you've added the icons, users will see:
- Your custom icon on the home screen
- Proper app name in the launcher
- Full-screen experience when launched
- Native app-like behavior

## 📱 Testing on Different Devices

### Android
1. Open Chrome/Edge
2. Tap the menu (3 dots)
3. Select "Add to Home Screen"
4. Verify icon appears correctly

### iOS
1. Open Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Verify icon appears correctly

---

**Note**: The icon generator tool (`generate-icons.html`) is a simple HTML file that you can open in any modern browser to resize your favicon to the required dimensions.
