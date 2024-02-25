/**
 * This is the "new" ESLint flat configuration.
 * @see https://eslint.org/docs/latest/use/configure/configuration-files-new
 *
 * To make this works in VSCode (until this becomes the default), make sure to add this to your
 * workspace settings:
 *
 * "eslint.experimental.useFlatConfig": true
 */
import jsPlugin from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import importPlugin from 'eslint-plugin-import'
import jestPlugin from 'eslint-plugin-jest'
import jsdocPlugin from 'eslint-plugin-jsdoc'
import jsonFilesPlugin from 'eslint-plugin-json-files'
import preferArrowFunctionsPlugin from 'eslint-plugin-prefer-arrow-functions'
import prettierRecommendedConfig from 'eslint-plugin-prettier/recommended'
import tsdocPlugin from 'eslint-plugin-tsdoc'
import unicornPlugin from 'eslint-plugin-unicorn'
import globals from 'globals'
import * as jsoncParser from 'jsonc-eslint-parser'

const JAVASCRIPT_FILES = ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs']
const TYPESCRIPT_FILES = ['**/*.ts', '**/*.mts', '**/*.cts', '**/*.tsx']

export default [
  // Enable Node.js specific globals.
  // @see https://eslint.org/docs/latest/use/configure/migration-guide
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  // Unicorn recommended configs.
  // @see https://github.com/sindresorhus/eslint-plugin-unicorn
  unicornPlugin.configs['flat/recommended'],
  // Prettier recommended configs.
  // @see https://github.com/prettier/eslint-plugin-prettier
  prettierRecommendedConfig,
  // TypeScript and JavaScript files.
  {
    files: [...TYPESCRIPT_FILES, ...JAVASCRIPT_FILES],
    plugins: {
      'prefer-arrow-functions': preferArrowFunctionsPlugin,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        node: true,
        typescript: {
          // Uses `eslint-import-resolver-typescript` to support the `exports` syntax in `package.json`.
          // @see https://github.com/import-js/eslint-import-resolver-typescript
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      ...importPlugin.configs.recommended.rules,
      // Make sure there is always a space before comments.
      // @see https://eslint.org/docs/latest/rules/spaced-comment
      'spaced-comment': ['error'],
      // Prevent omission of curly brace (e.g. same-line if/return).
      // @see https://eslint.org/docs/latest/rules/curly
      curly: ['error'],
      // The Unicorn plugin comes with opinionated checks, including some that we prefer disabling.
      'unicorn/no-array-for-each': [
        // Performance is no longer an issue - we prefer `forEach` for readability.
        'off',
      ],
      'unicorn/numeric-separators-style': [
        // Doesn't add a lot of value and makes numbers look odd.
        'off',
      ],
      'unicorn/prefer-type-error': [
        // Not really applicable when using TypeScript (mostly triggers false positives).
        'off',
      ],
      'unicorn/no-null': [
        // `undefined` and `null` have distinct semantics (i.e. `undefined` means absent, while
        // `null` means explicitly set to empty). We prefer to keep both in our codebase.
        'off',
      ],
      'unicorn/number-literal-case': [
        // This rule conflicts with `prettier/prettier` and there is no way to disabled the prettier rule.
        // @see https://github.com/sindresorhus/eslint-plugin-unicorn/issues/2285
        'off',
      ],
      'prefer-arrow-functions/prefer-arrow-functions': [
        // There is no recommended configuration to extend so we have to set it here to enforce arrow functions.
        // @see https://github.com/JamieMason/eslint-plugin-prefer-arrow-functions
        'warn',
        {
          classPropertiesAllowed: false,
          disallowPrototype: false,
          returnStyle: 'unchanged',
          singleReturnOnly: false,
        },
      ],
    },
  },
  // JavaScript files.
  {
    files: JAVASCRIPT_FILES,
    plugins: {
      jsdoc: jsdocPlugin,
    },
    rules: {
      ...jsPlugin.configs.recommended.rules,
      ...jsdocPlugin.configs.recommended.rules,
      // Increase the level to 'error' for unused variables (the default is set to 'warning').
      // @see https://eslint.org/docs/latest/rules/no-unused-vars
      'no-unused-vars': ['error', { args: 'all' }],
    },
  },
  // TypeScript files.
  {
    files: TYPESCRIPT_FILES,
    plugins: {
      tsdoc: tsdocPlugin,
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['tsconfig.json'],
      },
    },
    rules: {
      ...importPlugin.configs.typescript.rules,
      ...tsPlugin.configs.recommended.rules,
      ...tsPlugin.configs['recommended-requiring-type-checking'].rules,
      // Validates that TypeScript doc comments conform to the TSDoc specification.
      // @see https://tsdoc.org/pages/packages/eslint-plugin-tsdoc/
      'tsdoc/syntax': 'warn',
      // Enforces explicit return types on functions and class methods to avoid unintentionally breaking contracts.
      // @see https://typescript-eslint.io/rules/explicit-module-boundary-types/
      '@typescript-eslint/explicit-function-return-type': 'error',
      // Checks members (classes, interfaces, types) and applies consistent ordering.
      // @see https://typescript-eslint.io/rules/member-ordering/
      '@typescript-eslint/member-ordering': [
        'error',
        {
          default: {
            memberTypes: ['field', 'constructor', 'method'],
          },
        },
      ],
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
  },
  // JSON files.
  {
    files: ['*.json'],
    ignores: ['**/package.json'],
    languageOptions: {
      parser: jsoncParser,
    },
  },
  // package.json files.
  {
    files: ['**/package.json'],
    plugins: {
      'json-files': jsonFilesPlugin,
    },
    processor: jsonFilesPlugin.processors['.json'],
    rules: {
      // Requires the `license` field in package.json.
      // @see https://github.com/kellyselden/eslint-plugin-json-files/blob/master/docs/rules/require-license.md
      'json-files/require-license': ['error', 'allow-unlicensed'],
      // Prevents dependency collisions between `dependencies` and `devDependencies` in package.json.
      // @see https://github.com/kellyselden/eslint-plugin-json-files/blob/master/docs/rules/require-unique-dependency-names.md
      'json-files/require-unique-dependency-names': ['error'],
      // Use sort-package-json to keep your keys in a predictable order.
      // @see https://github.com/kellyselden/eslint-plugin-json-files/blob/master/docs/rules/sort-package-json.md
      'json-files/sort-package-json': ['error'],
    },
  },
  // Jest.
  {
    files: ['tests/**/*.test.ts'],
    plugins: {
      jest: jestPlugin,
    },
    languageOptions: {
      parserOptions: {
        project: ['tests/jest.json'],
      },
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
    },
  },
  // Rules applying to all files.
  {
    rules: {
      'unicorn/prevent-abbreviations': [
        'error',
        {
          ignore: [
            // Commonly used "environment" abbreviation in Node.js.
            'env',
          ],
        },
      ],
    },
  },
  // Files to ignore (replaces `.eslintignore`)
  {
    ignores: ['coverage/*', 'lib/*'],
  },
]
