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

- Using 2 letter language codes is rarely sufficient. Without being explicit about the targeted country for a given language, it is
  impossible to provide the right format for some content such as dates and numbers. Also, while languages are similar across countries,
  there are different ways too say the same thing. Our hypothesis is that by better targeting the audience, the user experience will
  improve.
- About 99% of all cases can be covered using the `language`-`country` format. We could possibly extend script support in the future
  but one the approach being this library is to keep it as simple as possible, while providing the best match.

## How does the resolver work?

There are currently 4 different layers of detection:

1. Try exact BCP 47 locale code match.
2. Try the language code match from the HTTP header, related to the BCP 47 locale codes specified.
3. As a last resort, extract the languages from the specified locales and check if there is a match with the header's locales.
4. Uses the specified default locale.
