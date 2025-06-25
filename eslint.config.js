import js from '@eslint/js';
import globals from 'globals';
export default [
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
