# resolve-accept-language

[![License](https://img.shields.io/npm/l/make-coverage-badge.svg?color=brightgreen)](https://opensource.org/licenses/MIT)
[![npm download](https://img.shields.io/npm/dw/resolve-accept-language.svg?color=brightgreen)](https://www.npmjs.com/package/resolve-accept-language)
![Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen.svg)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)

Resolve the best locale based on the value of an `Accept-Language` HTTP header.

## Usage

> ⚠ In March 2024, version 3 of this package was released, which includes breaking changes. Please refer to the [upgrade guide](./V2-TO-V3-UPGRADE-GUIDE.md) before upgrading.

Add the package as a dependency:

```
npm install resolve-accept-language
```

Code example:

```ts
import { resolveAcceptLanguage } from 'resolve-accept-language'

/**
 * The API is well documented from within your IDE using TSDoc. The arguments are as follows:
 *
 * 1) The HTTP accept-language header.
 * 2) The available locales (they must contain the default locale).
 * 3) The default locale.
 */
console.log(
  resolveAcceptLanguage(
    'fr-CA;q=0.01,en-CA;q=0.1,en-US;q=0.001',
    // The `as const` is optional for TypeScript but gives better typing.
    ['en-US', 'fr-CA'] as const,
    'en-US'
  )
)
```

Output:

```
fr-CA
```

## Advanced use cases

You may want to control exactly the behavior depending on the type of match. For example, you might want to display a language picker on your home page if the match is not satisfactory. In those cases, you will need to use the `{ returnMatchType: true }` option. It offers more visibility into the selection process while matching a locale:

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

## How does the resolver work?

As per RFC 4647, this package uses the "lookup" matching scheme. This means that it will always produce exactly one match for a given request.

The matching strategy will use the following logic:

1. The default locale will always be placed as the first locale being evaluated since it is considered the highest quality content available. Otherwise, the locales will be evaluated in the order provided.
2. All locales and languages are extracted from the HTTP header and sorted by quality factor and position in the header.
3. The following matching logic will be performed:
   1. Perform a first loop on the directives
      1. If the directive is a locale, then try to find an exact locale match (**locale match**)
      2. If the directive is a language, then
         1. Create a new list of directives that have locales matching the language
         2. Loop through this new list, and try to find an exact locale match (**language-specific locale match**)
         3. If no match is found, then try to find a locale that matches the language (**language match**)
   2. Perform a second loop on the directives
      1. Create a new list of languages from the locales
      2. Loop through this new list, then try to find a locale that matches the language (**related-locale match**)
   3. If everything fails, then the fallback is the default locale (**default locale match**)

## Why another `Accept-Language` package?

The `Accept-Language` header has been around since 1999. Like many other standards that deal with languages, the header is based
on BCP 47 language tags. Language tags can be as simple as `fr` (non-country specific French) or more complex, for example,
`sr-Latn-RS` would represent Latin script Serbian.

One of the main challenges is that BCP 47 language tags can be either overly simple or too complex. This is one of the problems this
library will try to address by focusing on locales identifiers using the `language`-`country` format instead of trying to provide
full BCP 47 language tags support. The main reasons for this:

- Using 2 letter language codes is rarely sufficient. Without being explicit about the targeted country for a given language, it is impossible to provide the right format for some content such as dates and numbers. Also, while languages are similar across countries, there are different ways to say the same thing. Our hypothesis is that by better targeting the audience, the user experience will improve.
- About 99% of all cases can be covered using the `language`-`country` format. We could possibly extend script support in the future given a valid use case, but in the meantime, our goal is to keep this library as simple as possible, while providing the best matches.

## Additional references

- Matching of Language Tags ([RFC 4647](https://tools.ietf.org/html/rfc4647))
- Tags for Identifying Languages ([RFC 4646](https://tools.ietf.org/html/rfc4646))
- The Accept-Language request-header field ([RFC 2616 section 14.4](https://tools.ietf.org/html/rfc2616#section-14.4))
- Quality values ([RFC 2616 section 3.9](https://tools.ietf.org/html/rfc2616#section-3.9))
