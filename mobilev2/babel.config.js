module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated 4 a déplacé son plugin Babel vers react-native-worklets.
      // L'ancien chemin 'react-native-reanimated/plugin' n'existe plus.
      // Il doit rester en dernier dans la liste.
      'react-native-worklets/plugin',
    ],
  };
};
