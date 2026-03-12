const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const androidRoot = path.join(projectRoot, 'android');
const shortRoot = path.join(androidRoot, '.shortdeps');

function normalizePathForGradle(targetPath) {
  return targetPath.replace(/\\/g, '/');
}

const shortPathPackages = {
  'react-native-gesture-handler': {
    shortDir: 'rngh',
    cmakeListsPath:
      'android/build/generated/source/codegen/jni/CMakeLists.txt',
  },
  'react-native-safe-area-context': {
    shortDir: 'rnsac',
    cmakeListsPath: 'android/src/main/jni/CMakeLists.txt',
  },
  'react-native-screens': {
    shortDir: 'rns',
    cmakeListsPath: 'android/src/main/jni/CMakeLists.txt',
  },
  'react-native-svg': {
    shortDir: 'rnsvg',
    cmakeListsPath: 'android/src/main/jni/CMakeLists.txt',
  },
  'react-native-reanimated': {
    shortDir: 'rnr',
    cmakeListsPath: 'android/build/generated/source/codegen/jni/CMakeLists.txt',
  },
  'react-native-worklets': {
    shortDir: 'rnw',
    cmakeListsPath: 'android/build/generated/source/codegen/jni/CMakeLists.txt',
  },
};

function ensurePackageJunction(packageName, shortDir) {
  const packageRoot = path.dirname(
    require.resolve(`${packageName}/package.json`, {
      paths: [projectRoot],
    })
  );
  const linkPath = path.join(shortRoot, shortDir);

  fs.mkdirSync(shortRoot, { recursive: true });
  fs.rmSync(linkPath, { recursive: true, force: true });
  fs.symlinkSync(packageRoot, linkPath, 'junction');

  return linkPath;
}

const dependencies = Object.fromEntries(
  Object.entries(shortPathPackages).map(
    ([packageName, { shortDir, cmakeListsPath }]) => {
      const linkPath = ensurePackageJunction(packageName, shortDir);

      return [
        packageName,
        {
          platforms: {
            android: {
              sourceDir: normalizePathForGradle(path.join(linkPath, 'android')),
              cmakeListsPath: normalizePathForGradle(path.join(linkPath, cmakeListsPath)),
            },
          },
        },
      ];
    }
  )
);

module.exports = {
  dependencies,
};
