const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withNotifeeMavenRepo(config) {
  return withProjectBuildGradle(config, (config) => {
    const marker = "maven { url \"$rootDir/../node_modules/@notifee/react-native/android/libs\" }";
    if (config.modResults.contents.includes(marker)) return config;

    config.modResults.contents = config.modResults.contents.replace(
      /allprojects\s*\{\s*repositories\s*\{/,
      (match) => `${match}\n    ${marker}`,
    );
    return config;
  });
};
