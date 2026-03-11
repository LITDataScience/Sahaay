const { withAppBuildGradle, withSettingsGradle } = require('@expo/config-plugins');

module.exports = (config) => {
  // 1. Fix app/build.gradle to handle monorepo paths correctly
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('project.root =')) return config;

    // Inject monorepo path resolution at the top
    const monorepoFix = `
def projectRoot = rootDir.getAbsoluteFile().getParentFile().getAbsolutePath()
def monorepoRoot = new File(projectRoot, "..").getAbsoluteFile().getAbsolutePath()
`;
    config.modResults.contents = monorepoFix + config.modResults.contents;

    // Ensure the react block uses the correct node_modules
    config.modResults.contents = config.modResults.contents.replace(
      /autolinkLibrariesWithApp\(\)/,
      `autolinkLibrariesWithApp(new File(monorepoRoot, "node_modules"))`
    );

    return config;
  });

  // 2. Fix settings.gradle to find the React Native Gradle Plugin in the monorepo root
  config = withSettingsGradle(config, (config) => {
    config.modResults.contents = config.modResults.contents.replace(
      /includeBuild\(reactNativeGradlePlugin\)/,
      `// Fixed by Monorepo Plugin\nincludeBuild(reactNativeGradlePlugin)`
    );
    return config;
  });

  return config;
};
