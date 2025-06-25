const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.node
      }
    },
    ...js.configs.recommended,
    rules: {
      // Add your custom rules here if needed
    }
  }
];
