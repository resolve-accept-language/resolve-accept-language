# V1 to V2 upgrade guide

## Overview

If you are only using the `resolveAcceptLanguage` API (not the class) you can skip this guide.

If you are using the `ResolveAcceptLanguage` class, then we introduced breaking changes in version 2. This guide will help you upgrade your code to the new APIs.

To improve typing and simplify the APIs, we have made the following changes:

1. The constructor now requires to pass in a `defaultLocale` instead of relying on the order of the `locales`.
2. The `getBestMatch` API has been renamed to `getMatch`.
3. All other methods (e.g., `hasMatch`, `bestMatchIsLocaleBased`) were replaced by `getMatchType` which returns a `MATCH_TYPES` enum.

Here is a before/after comparison that will explain the changes:

### Before

```ts
import { ResolveAcceptLanguage } from 'resolve-accept-language'

/**
 * If you are planning to have a "default locale", make sure to add it first in the provided locale list.
 * By doing this, your match result will be identical to `resolveAcceptLanguage` as it always checks the
 * default locale first.
 */
const resolveAcceptLanguage = new ResolveAcceptLanguage('fr-CA;q=0.01,en-CA;q=0.1,en-US;q=0.001', [
  'en-US',
  'fr-CA',
])

if (resolveAcceptLanguage.hasMatch()) {
  const locale = resolveAcceptLanguage.getBestMatch() as string
  console.log(`A locale was matched: ${locale}`)

  if (resolveAcceptLanguage.bestMatchIsLocaleBased()) {
    console.log('The match is locale-based')
  } else if (resolveAcceptLanguage.bestMatchIsLanguageBased()) {
    console.log('The match is language-based')
  } else if (resolveAcceptLanguage.bestMatchIsRelatedLocaleBased()) {
    console.log('The match is related-locale-based')
  }
}

if (resolveAcceptLanguage.hasNoMatch()) {
  console.log('No match found :(')
}
```

### After

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
