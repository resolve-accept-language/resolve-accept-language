/**
 * Type override for eslint-plugin-prefer-arrow-functions.
 *
 * The plugin's types use `@typescript-eslint/utils` FlatConfig.Plugin which is
 * incompatible with `@eslint/core` Plugin due to a missing index signature on
 * LanguageOptions.
 *
 * This override can be removed once the following PR is merged:
 * @see https://github.com/JamieMason/eslint-plugin-prefer-arrow-functions/pull/70
 *
 * Root cause:
 * @see https://github.com/typescript-eslint/typescript-eslint/issues/9724
 */
declare module 'eslint-plugin-prefer-arrow-functions' {
  import type { Plugin } from '@eslint/core'

  const plugin: Plugin
  export default plugin
}
