const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Simplified config for maximum compatibility with Expo Go
config.maxWorkers = require('os').cpus().length;

module.exports = config;
