// eslint.config.mjs

import js from '@eslint/js';
import globals from 'globals';

import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

import pluginImport from 'eslint-plugin-import';
import pluginPromise from 'eslint-plugin-promise';
import pluginN from 'eslint-plugin-n';

export default [
  // 自ファイルを無視
  { ignores: ['eslint.config.mjs'] },

  // StoragePort の抽象メソッド未使用引数を許容
  {
    files: ['src/ports/storage.js'],
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // JavaScript / MJS
  {
    files: ['**/*.js', '**/*.mjs'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    plugins: {
      import: pluginImport,
      promise: pluginPromise,
      n: pluginN,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...pluginImport.configs.recommended.rules,
      ...pluginPromise.configs.recommended.rules,
      ...pluginN.configs['flat/recommended'].rules,

      'no-console': 'off',
      'n/hashbang': 'off',
      'n/no-unpublished-import': 'off',
      'import/no-unresolved': 'off',
    },
  },

  // TypeScript
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { project: './tsconfig.json' },
      globals: { ...globals.node },
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      'no-console': 'off',
      'n/hashbang': 'off',
    },
  },
];
