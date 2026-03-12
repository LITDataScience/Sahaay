const fs = require('fs');
const path = require('path');
const { withAppBuildGradle, withSettingsGradle } = require('expo/config-plugins');

const WINDOWS_SHORT_PATH_PACKAGES = [
  {
    packageName: 'react-native-screens',
    projectName: ':react-native-screens',
    shortDir: 'rns',
  },
  {
    packageName: 'react-native-worklets',
    projectName: ':react-native-worklets',
    shortDir: 'rnw',
  },
  {
    packageName: 'react-native-reanimated',
    projectName: ':react-native-reanimated',
    shortDir: 'rnr',
  },
  {
    packageName: 'expo-modules-core',
    projectName: ':expo-modules-core',
    shortDir: 'emc',
  },
  {
    packageName: 'react-native-gesture-handler',
    projectName: ':react-native-gesture-handler',
    shortDir: 'rngh',
  },
  {
    packageName: 'react-native-safe-area-context',
    projectName: ':react-native-safe-area-context',
    shortDir: 'rnsac',
  },
  {
    packageName: 'react-native-svg',
    projectName: ':react-native-svg',
    shortDir: 'rnsvg',
  },
];

function ensurePackageJunctions(platformProjectRoot) {
  if (process.platform !== 'win32') {
    return [];
  }

  const shortRoot = path.join(platformProjectRoot, '.shortdeps');

  return WINDOWS_SHORT_PATH_PACKAGES.map(
    ({ packageName, projectName, shortDir }) => {
      const packageRoot = path.dirname(
        require.resolve(`${packageName}/package.json`, {
          paths: [platformProjectRoot],
        })
      );
      const linkPath = path.join(shortRoot, shortDir);

      fs.mkdirSync(shortRoot, { recursive: true });
      fs.rmSync(linkPath, { recursive: true, force: true });
      fs.symlinkSync(packageRoot, linkPath, 'junction');

      return {
        projectName,
        shortAndroidDir: `.shortdeps/${shortDir}/android`,
      };
    }
  );
}

module.exports = (config) => {
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('REACT_NATIVE_WORKLETS_NODE_MODULES_DIR')) {
      return config;
    }

    const explicitNodeModuleDirs = `
def sahaayReactNativePackagePath = ["node", "--print", "require.resolve('react-native/package.json')"].execute(null, rootDir).text.trim()
def sahaayReactNativeWorkletsPackagePath = ["node", "--print", "require.resolve('react-native-worklets/package.json')"].execute(null, rootDir).text.trim()
project.ext.set("REACT_NATIVE_NODE_MODULES_DIR", new File(sahaayReactNativePackagePath).getParentFile().absolutePath)
project.ext.set("REACT_NATIVE_WORKLETS_NODE_MODULES_DIR", new File(sahaayReactNativeWorkletsPackagePath).getParentFile().absolutePath)
`;

    config.modResults.contents = `${explicitNodeModuleDirs}\n${config.modResults.contents}`;

    return config;
  });

  config = withSettingsGradle(config, (config) => {
    const platformProjectRoot = config.modRequest?.platformProjectRoot;
    const shortPathProjects = platformProjectRoot
      ? ensurePackageJunctions(platformProjectRoot)
      : [];

    if (!shortPathProjects.length) {
      return config;
    }

    const marker = '// sahaay short native module paths';
    if (config.modResults.contents.includes(marker)) {
      return config;
    }

    const shortPathOverrides = `${marker}
[
${shortPathProjects
  .map(
    ({ projectName, shortAndroidDir }) =>
      `  '${projectName}': '${shortAndroidDir}',`
  )
  .join('\n')}
].each { projectName, relativeAndroidDir ->
  if (findProject(projectName) != null) {
    project(projectName).projectDir = new File(rootDir, relativeAndroidDir)
  }
}
`;

    config.modResults.contents = `${config.modResults.contents}\n${shortPathOverrides}`;
    return config;
  });

  return config;
};
