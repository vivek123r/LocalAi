/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['@react-native'],
  rules: {
    'react/react-in-jsx-scope': 'off',
  },
};
