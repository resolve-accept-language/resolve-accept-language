# V2 to V3 upgrade guide

## Overview

The following breaking changes were done to both simplify and improve extensibility of the library:

- `resolveAcceptLanguage` is now a named import to improve dual (CommonJS/ESM) compatibility.
- `resolveAcceptLanguage` can now take a new argument called `options`.
- The `ResolveAcceptLanguage` class has been replaced by using `resolveAcceptLanguage` with the `{ returnMatchType: true }` option.
- A new match type provides more intelligent matches: `languageSpecificLocale`. More details in the [README](./README.md).
- The following match types were renamed for consistency:
  - `localeBased` ► `locale`
  - `languageBased` ► `language`
  - `relatedLocaleBased` ► `relatedLocale`

For non-class v2 implementations, all that you need to do is use `import { resolveAcceptLanguage } from 'resolve-accept-language'` instead of `import resolveAcceptLanguage from 'resolve-accept-language'`

For class implementations, here is a before/after comparison that will illustrate the changes:

### Before

```ts
import { MATCH_TYPES, ResolveAcceptLanguage } from 'resolve-accept-language'

const resolveAcceptLanguage = new ResolveAcceptLanguage(
  'fr-CA;q=0.01,en-CA;q=0.1,en-US;q=0.001' as const,
  ['en-US', 'fr-CA'],
  'fr-CA'
)

console.log(`A locale was matched: ${resolveAcceptLanguage.getMatch()}`)

if (resolveAcceptLanguage.getMatchType() === MATCH_TYPES.localeBased) {
  console.log('The match is locale-based')
} else if (resolveAcceptLanguage.getMatchType() === MATCH_TYPES.languageBased) {
  console.log('The match is language-based')
} else if (resolveAcceptLanguage.getMatchType() === MATCH_TYPES.relatedLocaleBased) {
  console.log('The match is related-locale-based')
} else if (resolveAcceptLanguage.getMatchType() === MATCH_TYPES.defaultLocale) {
  console.log('The match is the default locale')
}
```

### After

```ts
import { MATCH_TYPES, resolveAcceptLanguage } from 'resolve-accept-language'

const { match, matchType } = resolveAcceptLanguage(
  'fr-CA;q=0.01,en-CA;q=0.1,en-US;q=0.001' as const,
  ['en-US', 'fr-CA'],
  'fr-CA',
  { returnMatchType: true }
)

console.log(`A locale was matched: ${match}`)

if (matchType === MATCH_TYPES.locale) {
  console.log('The match is locale-based')
} else if (matchType === MATCH_TYPES.languageSpecificLocale) {
  console.log('The match is language specific locale-based')
} else if (matchType === MATCH_TYPES.language) {
  console.log('The match is language-based')
} else if (matchType === MATCH_TYPES.relatedLocale) {
  console.log('The match is related-locale-based')
} else if (matchType === MATCH_TYPES.defaultLocale) {
  console.log('The match is the default locale')
}
```

## Upgrading from V1?

If you are still on version 1, please following the [v1 to v2 upgrade guide](./V1-TO-V2-UPGRADE-GUIDE.md) first.
