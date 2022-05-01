# resolve-accept-language

[![License](https://img.shields.io/npm/l/make-coverage-badge.svg)](https://opensource.org/licenses/MIT)
[![npm download](https://img.shields.io/npm/dw/resolve-accept-language.svg)](https://www.npmjs.com/package/resolve-accept-language)
![Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen.svg)
![Dependencies](https://img.shields.io/badge/dependencies-0-green)
[![Known Vulnerabilities](https://snyk.io/test/github/Avansai/resolve-accept-language/badge.svg?targetFile=package.json)](https://snyk.io/test/github/Avansai/resolve-accept-language?targetFile=package.json)

Resolve the preferred locale based on the value of an `Accept-Language` HTTP header.

## Usage

Add the package as a dependency:

```
npm install resolve-accept-language
```

Code example:

```ts
import resolveAcceptLanguage from 'resolve-accept-language';

console.log(
  resolveAcceptLanguage('fr-CA;q=0.01,en-CA;q=0.1,en-US;q=0.001', ['en-US', 'fr-CA'], 'en-US')
);
```

Output:

```
fr-CA
```

## Advanced use cases

You may want to control exactly the behavior depending on the type of match. For example, you could want to display a language picker on your home page if the match is not satisfactory. In those cases, you will need to use the `ResolveAcceptLanguage` class instead. It offers more visibility into the selection process while matching a locale:

```ts
import { ResolveAcceptLanguage } from 'resolve-accept-language';

/**
 * If you are planning to have a "default locale", make sure to add it first in the provided locale list.
 * By doing this, your match result will be identical to `resolveAcceptLanguage` as it always checks the
 * default locale first.
 */
const resolveAcceptLanguage = new ResolveAcceptLanguage('fr-CA;q=0.01,en-CA;q=0.1,en-US;q=0.001', [
  'en-US',
  'fr-CA',
]);

if (resolveAcceptLanguage.hasMatch()) {
  const locale = resolveAcceptLanguage.getBestMatch() as string;
  console.log(`A locale was matched: ${locale}`);

  if (resolveAcceptLanguage.bestMatchIsLocaleBased()) {
    console.log('The match is locale-based');
  } else if (resolveAcceptLanguage.bestMatchIsLanguageBased()) {
    console.log('The match is language-based');
  } else if (resolveAcceptLanguage.bestMatchIsRelatedLocaleBased()) {
    console.log('The match is related-locale-based');
  }
}

if (resolveAcceptLanguage.hasNoMatch()) {
  console.log('No match found :(');
}
```

## How does the resolver work?

As per RFC 4647, this package uses the "lookup" matching scheme. This means that it will always produce exactly one match for a
given request.

The matching strategy will use the following logic:

1. The default locale (when provided) will always be put as the first locale being evaluated since it is considered the highest quality content available. Otherwise, the locales will be evaluated in the order provided, where the first is the highest quality and the last the lowest.
2. All locales and languages are extracted from the HTTP header and sorted by quality factor. Locales and languages that are in the HTTP header but not in scope are discarded.
3. Three different matching patterns (based on the HTTP header's quality factor and order of the provided locales):

   1. If there were any matches, get the highest-ranked (quality factor) locale or language code:

      1. **Locale-based match**: Is the highest-ranked a locale? If yes, this is the best match.
      2. **Language-based match**: Otherwise, find the first locale that matches the highest-ranked language.

   2. **Related-locale-based match**: If there is no match, find the first locale with a language that matches the highest-ranked language of locales that were not in scope. This is a bit of a "fuzzy match", but the presumption is that it's better to show content in a language that can be understood even if the country is wrong.

4. When using `resolveAcceptLanguage` return the default locale as a last resort option.

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
