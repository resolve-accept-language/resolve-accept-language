import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import esXPlugin from 'eslint-plugin-es-x'
import { flatConfigs as importXPluginFlatConfigs } from 'eslint-plugin-import-x'
import jestPlugin from 'eslint-plugin-jest'
import { configs as packageJsonConfigs } from 'eslint-plugin-package-json'
import preferArrowFunctionsPlugin from 'eslint-plugin-prefer-arrow-functions'
import prettierRecommendedConfig from 'eslint-plugin-prettier/recommended'
import tsdocPlugin from 'eslint-plugin-tsdoc'
import unicornPlugin from 'eslint-plugin-unicorn'
import * as jsoncParser from 'jsonc-eslint-parser'
import tsEslint, { configs as tsEslintConfigs } from 'typescript-eslint'

const TYPESCRIPT_FILES = ['**/*.ts', '**/*.mts', '**/*.cts']

/**
 * Unicorn rules that suggest modern ES APIs not available in ES5 environments. These are disabled
 * in shipped code to maintain backward compatibility with older browsers and runtimes, and
 * re-enabled for non-shipped files (tests, build scripts, config) that run in Node 20+.
 */
const UNICORN_MODERN_API_RULES = [
  'unicorn/prefer-includes', // ES2015 - Array/String.prototype.includes
  'unicorn/prefer-code-point', // ES2015 - String.prototype.codePointAt/String.fromCodePoint
  'unicorn/prefer-string-raw', // ES2015 - String.raw
  'unicorn/prefer-number-properties', // ES2015 - Number.parseInt/Number.parseFloat
  'unicorn/prefer-string-replace-all', // ES2021 - String.prototype.replaceAll
  'unicorn/prefer-at', // ES2022 - Array/String.prototype.at
  'unicorn/prefer-top-level-await', // ES2022 - top-level await (also incompatible with CJS)
  'unicorn/no-array-reverse', // ES2023 - Array.prototype.toReversed
  'unicorn/no-negated-condition', // Style - disabled to allow `indexOf() !== -1` patterns
]

/**
 * Set a list of Unicorn rules to a given severity level.
 *
 * @param rules - The Unicorn rule names to configure.
 * @param level - The severity level to apply ('off' to disable, 'error' to enforce).
 *
 * @returns An object mapping each rule name to the specified severity level.
 */
const setUnicornRules = (
  rules: string[],
  level: 'off' | 'error'
): Record<string, 'off' | 'error'> => Object.fromEntries(rules.map((rule) => [rule, level]))

/**
 * Syntax-only es-x rules that TypeScript already transpiles to ES5. These must be disabled
 * because we write modern TypeScript syntax (arrow functions, classes, template literals, etc.)
 * but rely on TypeScript's compiler to emit ES5-compatible output. Only runtime API rules
 * (e.g., `no-string-prototype-includes`) should remain active to prevent usage of APIs that
 * would require polyfills.
 */
const ES_X_SYNTAX_RULES_HANDLED_BY_TYPESCRIPT = Object.fromEntries(
  Object.keys(esXPlugin.configs['flat/restrict-to-es5'].rules)
    .filter(
      (rule) =>
        !rule.includes('prototype') &&
        !/no-(array-from|array-of|map$|set$|weak-map|weak-set|weak-ref|promise|proxy|reflect|typed-arrays|shared-array-buffer|atomics|object-assign|object-entries|object-fromentries|object-getownpropertydescriptors|object-getownpropertysymbols|object-is$|object-setprototypeof|object-values|object-groupby|object-hasown|number-|math-|string-fromcodepoint|string-raw|global-this|map-groupby)/.test(
          rule
        )
    )
    .map((rule) => [rule, 'off'] as const)
)

export default tsEslint.config(
  // Files to ignore (replaces `.eslintignore`).
  {
    // ESLint ignores `node_modules` and dot-files by default.
    // @see https://eslint.org/docs/latest/user-guide/configuring/ignoring-code
    ignores: [
      // Distribution (compiled code).
      'dist/',
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
      // @see https://github.com/un-ts/eslint-plugin-import-x
      importXPluginFlatConfigs.recommended,
      importXPluginFlatConfigs.typescript,
      // Restrict runtime APIs to ES5 to maximize backward compatibility.
      // Syntax rules are disabled since TypeScript handles transpilation.
      // @see https://github.com/eslint-community/eslint-plugin-es-x
      esXPlugin.configs['flat/restrict-to-es5'],
    ],
    plugins: { 'prefer-arrow-functions': preferArrowFunctionsPlugin, tsdoc: tsdocPlugin },
    languageOptions: { parserOptions: { project: ['tsconfig.esm.json'] } },
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver()],
    },
    rules: {
      // Disable es-x syntax rules that TypeScript transpiles (keep only runtime API rules).
      ...ES_X_SYNTAX_RULES_HANDLED_BY_TYPESCRIPT,
      // Make sure there is always a space before comments.
      // @see https://eslint.org/docs/latest/rules/spaced-comment
      'spaced-comment': ['error'],
      // Prevent omission of curly brace (e.g. same-line if/return).
      // @see https://eslint.org/docs/latest/rules/curly
      curly: ['error'],
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
        // The Unicorn plugin comes with opinionated checks, including some that we prefer disabling.
        'unicorn/no-array-reduce': [
          // 'reduce' is a powerful method for functional programming patterns, use it when appropriate.
          'off',
        ],
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
        // Disable modern API rules for backward compatibility (see UNICORN_MODERN_API_RULES).
        ...setUnicornRules(UNICORN_MODERN_API_RULES, 'off'),
      },
    },
  },
  // Special configuration for the ESLint configuration file.
  // Note: eslint/tsconfig.json uses `skipLibCheck` due to type errors in @package-json/types.
  // This can be removed once https://github.com/un-ts/eslint-plugin-import-x/pull/476 is merged.
  {
    files: ['eslint.config.ts', 'eslint/**/*.ts'],
    languageOptions: { parserOptions: { project: ['eslint/tsconfig.json'] } },
  },
  // Non-shipped files (build scripts, tests, config) run in Node 20+ and should use modern APIs.
  {
    files: ['src/build-scripts/**/*.ts', 'tests/**/*.ts', 'eslint.config.ts', 'eslint/**/*.ts'],
    rules: {
      // Disable all es-x restrictions since these files are not shipped to consumers.
      ...Object.fromEntries(
        Object.keys(esXPlugin.configs['flat/restrict-to-es5'].rules).map((rule) => [rule, 'off'])
      ),
      // Re-enable modern unicorn rules that are disabled for backward compatibility in shipped code.
      ...setUnicornRules(UNICORN_MODERN_API_RULES, 'error'),
    },
  },
  // Build script TypeScript files.
  {
    files: TYPESCRIPT_FILES.map((pattern) => `src/build-scripts/${pattern}`),
    languageOptions: { parserOptions: { project: ['src/build-scripts/tsconfig.json'] } },
  },
  // JSON files.
  { files: ['*.json'], ignores: ['**/package.json'], languageOptions: { parser: jsoncParser } },
  // package.json files.
  // @see https://github.com/JoshuaKGoldberg/eslint-plugin-package-json
  {
    ...packageJsonConfigs.recommended,
    rules: {
      ...packageJsonConfigs.recommended.rules,
      // Keep package.json keys in a predictable order.
      // @see https://github.com/JoshuaKGoldberg/eslint-plugin-package-json/blob/main/docs/rules/order-properties.md
      'package-json/order-properties': ['error'],
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
