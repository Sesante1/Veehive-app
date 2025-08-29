// const { getDefaultConfig } = require("expo/metro-config");
// const { withNativeWind } = require('nativewind/metro');

// const config = getDefaultConfig(__dirname);

// const defaultConfig = getDefaultConfig(__dirname);
// defaultConfig.resolver.assetExts.push('cjs');

// module.exports = withNativeWind(config, { input: './global.css' })
// module.exports = defaultConfig;

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add support for `.cjs` files (for Firebase dependencies)
config.resolver.assetExts.push("cjs");

// Add NativeWind support
module.exports = withNativeWind(config, {
  input: "./global.css",
});
