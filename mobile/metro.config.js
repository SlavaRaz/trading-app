const { getDefaultConfig } = require('expo/metro-config');
const { withSkiaWeb } = require('@shopify/react-native-skia/metro');

const config = getDefaultConfig(__dirname);

module.exports = withSkiaWeb(config, {
  defaultLanguage: 'glsl',
});
