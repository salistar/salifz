{
  "expo": {
    "name": "Salifz",
    "slug": "salifz",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#059669"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.salifz.app",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#059669"
      },
      "package": "com.salifz.app",
      "versionCode": 1
    },
    "web": {
      "favicon": "./assets/images/favicon.png",
      "bundler": "metro"
    },
    "plugins": [
      "expo-font",
      "expo-secure-store",
      "expo-localization"
    ],
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
