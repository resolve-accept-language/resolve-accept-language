# resolve-accept-language

Resolve the preferred locale based on the value of an `Accept-Language` HTTP header.

## Usage

Add the package as a dependency:

```
npm install resolve-accept-language
```

```ts
import resolveAcceptLanguage from 'resolve-accept-language';

console.log(
  resolveAcceptLanguage(
    'fr-CA;q=0.01,en-CA;q=0.1,en-US;q=0.001',
    ['en-US', 'fr-CA'],
    'en-US'
  )
);
```

Output:

```
fr-CA
```

## Why another `Accept-Language` package?

While there are several existing packages to detect language, this package has been designed with the following features in mind:

- Simple to use (single method: `resolveAcceptLanguage`)
- Designed around a clear use case: automatically detect the BCP47 locale code on a multi-lingual site's homepage
- Focuses on BCP47 locales codes, following the `language`-`country` (2 letter codes) pattern only:
  - This is enforced on parameters only (`supportedLocales` & `defaultLocale`) - 2 letter language codes in the HTTP header are evaluated while performing the resolution
  - Passing language codes in parameters is not permitted because:
    - Without a country code it's impossible to display country-specific strings correctly (e.g. dates, numbers, units)
    - Every language is specific to a country. While there might be small nuance, its important to know which "flavor" of a language is being displayed
  - The most commons BCP47 locale codes are supported only since they cover most likely 99% of the world's market in term of Internet users
- Based on RFC 2616, RFC 4647, RFC 5646 and RFC 7231.
- Supported 4 different layers of detection:
  - First: try exact BCP47 locale code match
  - Second: try the language code match from the HTTP header, related to the BCP47 locale codes specified
  - Third: as a last resort, extract the languages from the specified locales and check if there is a match with the header's locales
  - Fourth: uses the specified default locale
