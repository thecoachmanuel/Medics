module.exports = ({ config }) => {
  const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || "https://medicsonline.ng";
  return {
    name: "MedicsApp",
    slug: "medicsapp-webview",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      backgroundColor: "#ffffff",
      resizeMode: "contain"
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSPhotoLibraryUsageDescription: "This app needs access to your photo library to upload medical documents.",
        NSCameraUsageDescription: "This app needs access to your camera to capture and upload medical documents.",
        NSMicrophoneUsageDescription: "This app may access the microphone for video or audio uploads if required by the website."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "CAMERA",
        "READ_MEDIA_IMAGES",
        "READ_MEDIA_VIDEO",
        "READ_MEDIA_AUDIO",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ],
      softwareKeyboardLayoutMode: "pan"
    },
    web: {
      bundler: "metro"
    },
    extra: {
      WEB_URL: WEB_URL
    }
  };
};
