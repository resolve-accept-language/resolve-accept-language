import compat from 'eslint-plugin-compat'
import * as importPlugin from 'eslint-plugin-import'
import jestPlugin from 'eslint-plugin-jest'
import jsonFilesPlugin from 'eslint-plugin-json-files'
import preferArrowFunctionsPlugin from 'eslint-plugin-prefer-arrow-functions'
import prettierRecommendedConfig from 'eslint-plugin-prettier/recommended'
import tsdocPlugin from 'eslint-plugin-tsdoc'
import unicornPlugin from 'eslint-plugin-unicorn'
import * as jsoncParser from 'jsonc-eslint-parser'
import tsEslint, { configs as tsEslintConfigs } from 'typescript-eslint'

const TYPESCRIPT_FILES = ['**/*.ts', '**/*.mts', '**/*.cts']

export default tsEslint.config(
  // Files to ignore (replaces `.eslintignore`).
  {
    // ESLint ignores `node_modules` and dot-files by default.
    // @see https://eslint.org/docs/latest/user-guide/configuring/ignoring-code
    ignores: [
      // Compiled project.
      'lib/',
      // Jest files.
      'coverage/',
    ],
  },
  // Prettier recommended configs.
  // @see https://github.com/prettier/eslint-plugin-prettier
  prettierRecommendedConfig,
  // Unicorn recommended configs.
  // @see https://github.com/sindresorhus/eslint-plugin-unicorn
  unicornPlugin.configs['recommended'],
  // TypeScript configuration.
  {
    files: [...TYPESCRIPT_FILES],
    extends: [
      // TypeScript ESLint recommended configs.
      // @see https://typescript-eslint.io/getting-started/
      tsEslintConfigs.recommended,
      tsEslintConfigs.recommendedTypeChecked,
      // Make sure that imports are valid.
      // @see https://github.com/import-js/eslint-plugin-import
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
      // Detect incompatible code usage that would require Polyfills.
      // @see https://github.com/amilajack/eslint-plugin-compat
      compat.configs['flat/recommended'],
    ],
    plugins: { 'prefer-arrow-functions': preferArrowFunctionsPlugin, tsdoc: tsdocPlugin },
    languageOptions: { parserOptions: { project: ['tsconfig.esm.json'] } },
    /**
     * @see https://github.com/import-js/eslint-plugin-import/issues/3170
     */
    settings: { 'import/resolver': { typescript: true } },
    rules: {
      // Make sure there is always a space before comments.
      // @see https://eslint.org/docs/latest/rules/spaced-comment
      'spaced-comment': ['error'],
      // Prevent omission of curly brace (e.g. same-line if/return).
      // @see https://eslint.org/docs/latest/rules/curly
      curly: ['error'],
      // The Unicorn plugin comes with opinionated checks, including some that we prefer disabling.
      'unicorn/no-array-reduce': [
        // 'reduce' is a powerful method for functional programming patterns, use it when appropriate.
        'off',
      ],
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
        { default: { memberTypes: ['field', 'constructor', 'method'] } },
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
      /**
       * Unicorn-specific configuration.
       */
      // eslint-disable-next-line unicorn/no-useless-spread
      ...{
        /**
         * Avoids circular conflict between `unicorn/no-nested-ternary` and `prettier`.
         *
         * @see https://github.com/sindresorhus/eslint-plugin-unicorn/issues/2604
         */
        'unicorn/no-nested-ternary': 'off',
        // Performance is no longer an issue - we prefer `forEach` for readability.
        'unicorn/no-array-for-each': 'off',
        // Doesn't add a lot of value and makes numbers look odd.
        'unicorn/numeric-separators-style': 'off',
        // Not really applicable when using TypeScript (mostly triggers false positives).
        'unicorn/prefer-type-error': 'off',
        /**
         * `undefined` and `null` have distinct semantics (i.e. `undefined` means absent, while
         * `null` means explicitly set to empty). We prefer to keep both in our codebase.
         */
        'unicorn/no-null': 'off',
        /**
         * This rule conflicts with `prettier/prettier` and there is no way to disabled the Prettier rule.
         *
         * @see https://github.com/sindresorhus/eslint-plugin-unicorn/issues/2285
         */
        'unicorn/number-literal-case': 'off',
        // Add little value and would require polyfills for engines older than ES2021.
        'unicorn/prefer-string-replace-all': 'off',
        // Add little value and would require polyfills for engines older than ES2022.
        'unicorn/prefer-at': 'off',
        // Add little value and would require polyfills for engines older than ES2022.
        'unicorn/prefer-top-level-await': 'off',
      },
    },
  },
  // Special configuration for the ESLint configuration file.
  {
    files: ['eslint.config.ts', 'eslint/**/*.ts'],
    languageOptions: { parserOptions: { project: ['eslint/tsconfig.json'] } },
  },
  // Build script TypeScript files.
  {
    files: TYPESCRIPT_FILES.map((pattern) => `src/build-scripts/${pattern}`),
    languageOptions: { parserOptions: { project: ['src/build-scripts/tsconfig.json'] } },
  },
  // JSON files.
  { files: ['*.json'], ignores: ['**/package.json'], languageOptions: { parser: jsoncParser } },
  // package.json files.
  {
    files: ['**/package.json'],
    plugins: { 'json-files': jsonFilesPlugin },
    processor: jsonFilesPlugin.processors.json,
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
    plugins: jestPlugin.configs['flat/recommended'].plugins,
    languageOptions: {
      ...jestPlugin.configs['flat/recommended'].languageOptions,
      parserOptions: { project: ['tests/jest.json'] },
    },
    rules: jestPlugin.configs['flat/recommended'].rules,
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
  }
)
