const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const pak = require('../package.json');

const root = path.resolve(__dirname, '..');

/**
 * Metro config for the example app: watches the library's `src` folder and
 * resolves the library package name to the local source so changes to the
 * library are reflected without publishing/linking a build.
 */
const config = {
  watchFolders: [root],
  resolver: {
    nodeModulesPaths: [path.resolve(__dirname, 'node_modules'), path.resolve(root, 'node_modules')],
    extraNodeModules: {
      [pak.name]: root,
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
