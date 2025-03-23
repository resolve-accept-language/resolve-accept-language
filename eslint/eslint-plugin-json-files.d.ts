/**
 * @see https://github.com/kellyselden/eslint-plugin-json-files/issues/188
 */
declare module 'eslint-plugin-json-files' {
  import type { Linter, Rule } from 'eslint'

  const plugin: {
    processors: {
      json: Linter.Processor
    }
    configs?: Record<string, Linter.Config>
    rules?: Record<string, Rule.RuleModule>
  }

  export default plugin
}
