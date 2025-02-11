export default {
    name: "አማርኛFlix",
    slug: "amharicflix",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#1F2937"
    },
    updates: {
        fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
        "**/*"
    ],
    ios: {
        supportsTablet: true,
        bundleIdentifier: "com.yourcompany.amharicflix"
    },
    android: {
        adaptiveIcon: {
            foregroundImage: "./assets/adaptive-icon.png",
            backgroundColor: "#1F2937"
        },
        package: "com.yourcompany.amharicflix"
    },
    web: {
        favicon: "./assets/favicon.png"
    }
}; 