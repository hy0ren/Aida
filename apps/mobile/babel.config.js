const { expoRouterBabelPlugin } = require("babel-preset-expo/build/expo-router-plugin");

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // Do not add reanimated/worklets here — nativewind/babel already applies
      // react-native-worklets/plugin; react-native-reanimated/plugin is the same module.
      ["babel-preset-expo", { jsxImportSource: "nativewind", reanimated: false }],
      "nativewind/babel",
    ],
    plugins: [
      [expoRouterBabelPlugin, {}, "expo-router-workspace"],
    ],
  };
};
