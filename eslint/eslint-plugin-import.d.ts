/**
 * @see https://github.com/import-js/eslint-plugin-import/issues/3169
 */
declare module 'eslint-plugin-import' {
  import type { Linter } from 'eslint'

  export const flatConfigs: {
    recommended: Linter.Config
    typescript: Linter.Config
    [key: string]: Linter.Config | undefined
  }
}
