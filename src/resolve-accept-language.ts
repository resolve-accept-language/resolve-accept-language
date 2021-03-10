import Locale from './locale';
import LocaleList from './locale-list';
import LocaleQualityList from './locale-quality-list';
import LanguageQualityList from './language-quality-list';

//todo: improve readme (code coverage images)
//todo: add exclusion list for 0 quality (verify RFC)

/**
 * Resolve the preferred locale from an HTTP `Accept-Language` header.
 *
 * The `Accept-Language` header has been around since 1999. While language codes can be used in the header, this library will
 * only resolve BCP47 (locales) codes. The main reason for this is that internationalization (i18n) requires country codes to
 * correctly format common variables types such as numbers and dates. Most major market can be represented by a BCP47 locale
 * code that consist of an ISO 639-1 alpha-2 language code and an ISO 3166-1 alpha-2 country code.
 *
 * @param acceptLanguageHeader The value coming from an HTTP request `Accept-Language` header.
 * @param supportedLocales An array of BCP47 locale codes (`language`-`country`). It must include the default locale.
 * @param defaultLocale The default BCP47 locale code (`language`-`country`) when no match is found.
 *
 * @returns The preferred (case-normalized) BCP47 locale code.
 */
export default function resolveAcceptLanguage(
  acceptLanguageHeader: string,
  supportedLocales: string[],
  defaultLocale: string
): string {
  const localeList = new LocaleList(supportedLocales);
  const defaultLocaleObject = new Locale(defaultLocale);

  if (!localeList.locales.includes(defaultLocaleObject.code)) {
    throw new Error('default locale must be part of the supported locales');
  }

  if (!acceptLanguageHeader) {
    return defaultLocaleObject.code;
  }

  // Locales sorted by quality.
  const localesByQuality = new LocaleQualityList();
  // Languages sorted by quality.
  const languagesByQuality = new LanguageQualityList();
  // Supported languages of unsupported locales sorted by quality.
  const localeLanguagesByQuality = new LanguageQualityList();

  const directives = acceptLanguageHeader
    .split(',')
    .map((directive) => directive.trim());

  for (const directive of directives) {
    // Based on RFC 2616, RFC 4647, RFC 5646 and RFC 7231.
    const directiveMatch = directive.match(
      /^((?<matchedLanguageCode>\*|([A-Z]{2}))((?<!\*)-(?<matchedCountryCode>[A-Z]{2}))?)(;q=(?<matchedQuality>1|0|0.[0-9]{1,3}))?$/i
    );

    if (directiveMatch) {
      const { locale, languageCode, quality } = getDirectiveDetails(
        directiveMatch.groups as DirectiveMatchRegExpGroups,
        defaultLocaleObject
      );

      // If the language is not supported, skip to the next match.
      if (!localeList.languages.includes(languageCode)) {
        continue;
      }

      // If there is no country code (while the language is supported), add the language preference.
      if (!locale) {
        languagesByQuality.add(quality, languageCode);
        continue;
      }

      // If the locale is not supported, but the locale's language is, add to locale language preference.
      if (
        !localeList.locales.includes(locale) &&
        localeList.languages.includes(languageCode)
      ) {
        localeLanguagesByQuality.add(quality, languageCode);
        continue;
      }

      // If the locale is supported, add the locale preference.
      localesByQuality.add(quality, locale);
    }
  }

  if (!localesByQuality.isEmpty()) {
    // Return the matching locale with the highest quality.
    return localesByQuality.getTop();
  } else if (!languagesByQuality.isEmpty()) {
    // Return the matching locale with the language quality.
    return languagesByQuality.getTopFromLocaleList(localeList);
  } else if (!localeLanguagesByQuality.isEmpty()) {
    // Return the matching locale with the locale language quality.
    return localeLanguagesByQuality.getTopFromLocaleList(localeList);
  }

  return defaultLocaleObject.code;
}

/**
 * RegExp matches from an HTTP `Accept-Language` header directive.
 *
 * @param matchedLanguageCode RegExp match for the ISO 639-1 alpha-2 language code.
 * @param matchedCountryCode RegExp match for the BCP47 locale code locale using the `language`-`country` format.
 * @param matchedQuality RegExp match for the quality factor (default is 1; values can range from 0 to 1 with up to 3 decimals)
 */
type DirectiveMatchRegExpGroups = {
  matchedLanguageCode: string;
  matchedCountryCode: string;
  matchedQuality: string;
};

/**
 * Details of an HTTP `Accept-Language` header directive.
 *
 * @param locale The BCP47 locale code locale using the `language`-`country` format.
 * @param languageCode The ISO 639-1 alpha-2 language code.
 * @param quality The quality factor (default is 1; values can range from 0 to 1 with up to 3 decimals)
 */
type DirectiveDetails = {
  locale?: string;
  languageCode: string;
  quality: string;
};

/**
 * Get directive details from a regex match.
 *
 * @param directiveMatch Regex match result for an `Accept-Language` header directive.
 * @param defaultLocaleObject The default locale object used to normalize the result.
 *
 * @returns Parsed results from a matched `Accept-Language` header directive.
 */
function getDirectiveDetails(
  directiveMatch: DirectiveMatchRegExpGroups,
  defaultLocaleObject: Locale
): DirectiveDetails {
  const {
    matchedLanguageCode,
    matchedCountryCode,
    matchedQuality,
  } = directiveMatch;

  const languageCode =
    matchedLanguageCode == '*'
      ? defaultLocaleObject.languageCode
      : matchedLanguageCode.toLowerCase();
  const countryCode =
    matchedLanguageCode == '*'
      ? defaultLocaleObject.countryCode
      : matchedCountryCode
      ? matchedCountryCode.toUpperCase()
      : undefined;
  const quality =
    matchedQuality === undefined ? '1' : parseFloat(matchedQuality).toString(); // Remove trailing zeros.

  const locale = countryCode ? `${languageCode}-${countryCode}` : undefined;

  return { locale, languageCode, quality };
}
