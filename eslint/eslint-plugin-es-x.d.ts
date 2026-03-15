/**
 * Temporary type declaration until the plugin ships its own types.
 * This file can be removed once https://github.com/eslint-community/eslint-plugin-es-x/pull/338 is merged.
 *
 * @see https://github.com/eslint-community/eslint-plugin-es-x/issues/280
 */
declare module 'eslint-plugin-es-x' {
  import type { Linter } from 'eslint'

  const plugin: {
    configs: Record<string, Linter.Config & { rules: Partial<Record<string, Linter.RuleEntry>> }>
    rules: Record<string, unknown>
  }

  export default plugin
}
