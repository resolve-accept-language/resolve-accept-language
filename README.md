# resolve-accept-language

[![License](https://img.shields.io/npm/l/make-coverage-badge.svg)](https://opensource.org/licenses/MIT)
[![npm download](https://img.shields.io/npm/dw/resolve-accept-language.svg)](https://www.npmjs.com/package/resolve-accept-language)
![Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen.svg)
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

## Why another `Accept-Language` package?

The `Accept-Language` header has been around since 1999. Like many other standards that deal with languages, the headers is based
on BCP 47 language tags. Language tags can be as simple as `fr` (non country specific French) or more complex, for example
`sr-Latn-RS` would represent latin script Serbian.

One of the main challenge is that BCP 47 language tags can be either overly simple or too complex. This is one of the problem this
library will try to address by focusing on locales identifier using the `language`-`country` format instead of trying to provide
full BCP 47 language tags support. The main reasons for this:

- Using 2 letter language codes is rarely sufficient. Without being explicit about the targeted country for a given language, it is impossible to provide the right format for some content such as dates and numbers. Also, while languages are similar across countries, there are different ways to say the same thing. Our hypothesis is that by better targeting the audience, the user experience will improve.
- About 99% of all cases can be covered using the `language`-`country` format. We could possibly extend script support in the future but one the approach being this library is to keep it as simple as possible, while providing the best match.

## How does the resolver work?

As per RFC 4647, this solution uses the "lookup" matching scheme. This means that it will always produce exactly one match for a
given request.

The matching strategy will use the following rules:

1. Extract all **supported** locales and languages and sort them by quality factor.
2. If the first result with the highest quality is a locale, return this as the best match.
3. Otherwise, if that result is a language, find the first supported locale with that language (the default locale is always checked first).
4. Otherwise, if no locale or language as direct matches, check if there is a match with an unsupported locales that had a supported language (the default locale is always checked first).
5. When all fails, return the default locale.

## Additional references

- Matching of Language Tags ([RFC 4647](https://tools.ietf.org/html/rfc4647))
- Tags for Identifying Languages ([RFC 4646](https://tools.ietf.org/html/rfc4646))
- The Accept-Language request-header field ([RFC 2616 section 14.4](https://tools.ietf.org/html/rfc2616#section-14.4))
- Quality values ([RFC 2516 section 3.9](https://tools.ietf.org/html/rfc2616#section-3.9))


