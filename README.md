# resolve-accept-language

[![License](https://img.shields.io/npm/l/make-coverage-badge.svg?color=brightgreen)](https://opensource.org/licenses/MIT)
[![Download Stats](https://img.shields.io/npm/dw/resolve-accept-language.svg?color=brightgreen)](https://www.npmjs.com/package/resolve-accept-language)
![Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen.svg)
[![Package Size](https://deno.bundlejs.com/badge?q=resolve-accept-language@latest&treeshake=[*])](https://bundlejs.com/?q=resolve-accept-language@latest&treeshake=[*])
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

### Match types

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
} else if (matchType === MATCH_TYPES.languageCountry) {
  console.log('The match is language country-based')
} else if (matchType === MATCH_TYPES.defaultLocale) {
  console.log('The match is the default locale')
}
```

### Country match

There may be cases where it is preferred to perform a "country match" before falling back to the default locale match. For example:

```ts
console.log(
  resolveAcceptLanguage('af-ZA', ['en-US', 'zu-ZA'] as const, 'en-US', {
    returnMatchType: true,
    matchCountry: true,
  })
)
```

Output:

```json
{ "match": "zu-ZA", "matchType": "country" }
```

In this case, the header prefers `af-ZA`, which shares the same country as `zu-ZA`. Instead of falling back to the default `en-US`, `zu-ZA` is matched.

This behavior is not set by default because, in most cases, the quality of the default locale is better than the translations. Performing a country match could potentially lower the quality of the selection. However, there may be cases where this is not true, which is why the `matchCountry` option exists.

## How does the resolver work?

As per RFC 4647, this package uses the "lookup" matching scheme. This means that it will always produce exactly one match for a given request.

The matching strategy follows these steps, in order:

1. Start with the default locale, as it's considered the highest quality content available.
2. Extract all locales and languages from the HTTP header, sorted by quality factor and position in the header. Each of these elements is referred to as a "directive".
3. Perform matching in several stages:
   1. **Locale Match**: Look for an exact locale match in the directives.
   2. **Language-Specific Locale Match**: If no locale match is found, look for a locale that matches the language of the directive.
   3. **Language Match**: If no language-specific locale match is found, look for a locale that matches the language.
   4. **Related-Locale Match**: If no language match is found, look for a locale that matches the language in the next round of directives.
   5. **Language Country Match**: If no related-locale match is found, look for a locale that matches the default locale's language but in a country from a locale specified in a directive.
   6. **Country Match**: If the option is enabled and no language country match is found, look for a locale that matches the country in the next round of directives.
   7. **Default Locale Match**: If all else fails, fall back to the default locale.

Each stage only happens if the previous stage didn't find a match. This ensures the best possible match is found according to the given criteria.

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
