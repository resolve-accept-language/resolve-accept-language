import Locale from './locale';
import LocaleList from './locale-list';
import LookupList from './lookup-list';

/**
 * Resolve the preferred locale from an HTTP `Accept-Language` header.
 *
 * @param acceptLanguageHeader - The value of an HTTP request `Accept-Language` header (also known as a "language priority list").
 * @param supportedLocales - An array of locale identifiers (`language`-`country`). It must include the default locale.
 * @param defaultLocale - The default locale (`language`-`country`) when no match is found.
 *
 * @returns The preferred locale identifier following the BCP 47 `language`-`country` (case-normalized) format.
 *
 * @example
 * // returns 'fr-CA'
 * resolveAcceptLanguage(
 *   'fr-CA;q=0.01,en-CA;q=0.1,en-US;q=0.001',
 *   ['en-US', 'fr-CA'],
 *   'en-US'
 * )
 */
export default function resolveAcceptLanguage(
  acceptLanguageHeader: string,
  supportedLocales: string[],
  defaultLocale: string
): string {
  const localeList = new LocaleList(supportedLocales);
  const defaultLocaleObject = new Locale(defaultLocale);

  if (!localeList.locales.has(defaultLocaleObject.identifier)) {
    throw new Error('default locale must be part of the supported locales');
  }

  if (!acceptLanguageHeader) {
    return defaultLocaleObject.identifier;
  }

  const lookupList = new LookupList();
  const directives = acceptLanguageHeader.split(',').map((directive) => directive.trim());

  for (const directive of directives) {
    /**
     * The regular expression is excluding certain directives due to the inability to configure those options in modern
     * browsers today (also those options seem unpractical):
     *
     * - The wildcard character "*", as per RFC 2616 (section 14.4), should match any unmatched language tag.
     * - Language tags that starts with a wildcard (e.g. "*-CA") should match the first supported locale of a country.
     * - A quality value equivalent to "0", as per RFC 2616 (section 3.9), should be considered as "not acceptable".
     */
    const directiveRegex = RegExp(
      /^((?<matchedLanguageCode>([A-Z]{2}))(-(?<matchedCountryCode>[A-Z]{2}))?)(;q=(?<matchedQuality>1|0.(\d*[1-9]\d*){1,3}))?$/i
    );
    const directiveDetails = getDirectiveDetails(
      directiveRegex.exec(directive)?.groups as DirectiveMatchRegExpGroups
    );

    if (directiveDetails) {
      const { locale, languageCode, quality } = directiveDetails;

      // If the language is not supported, skip to the next match.
      if (!localeList.languages.has(languageCode)) {
        continue;
      }

      // If there is no country code (while the language is supported), add the language preference.
      if (!locale) {
        lookupList.addLanguage(quality, languageCode);
        continue;
      }

      // If the locale is not supported, but the locale's language is, add to locale language preference.
      if (!localeList.locales.has(locale) && localeList.languages.has(languageCode)) {
        lookupList.addUnsupportedLocaleLanguage(quality, languageCode);
        continue;
      }

      // If the locale is supported, add the locale preference.
      lookupList.addLocale(quality, locale);
    }
  }

  return lookupList.getBestMatch(localeList, defaultLocaleObject);
}

/**
 * RegExp matches from an HTTP `Accept-Language` header directive.
 *
 * @param matchedLanguageCode - RegExp match for the ISO 639-1 alpha-2 language code.
 * @param matchedCountryCode - RegExp match for the ISO 3166-1 alpha-2 country code.
 * @param matchedQuality - RegExp match for the quality factor (default is 1; values can range from 0 to 1 with up to 3 decimals)
 */
type DirectiveMatchRegExpGroups = {
  matchedLanguageCode: string;
  matchedCountryCode?: string;
  matchedQuality?: string;
};

/**
 * Details of an HTTP `Accept-Language` header directive.
 *
 * @param locale - The locale identifier using the `language`-`country` format.
 * @param languageCode - The ISO 639-1 alpha-2 language code.
 * @param quality - The quality factor (default is 1; values can range from 0 to 1 with up to 3 decimals)
 */
type DirectiveDetails = {
  locale?: string;
  languageCode: string;
  quality: string;
};

/**
 * Get directive details from a regex match.
 *
 * @param directiveMatch - Regex match result for an `Accept-Language` header directive.
 * @param defaultLocaleObject - The default locale object used to normalize the result.
 *
 * @returns Parsed results from a matched `Accept-Language` header directive or `null` when there is no match.
 */
function getDirectiveDetails(
  directiveMatch: DirectiveMatchRegExpGroups | null
): DirectiveDetails | null {
  if (!directiveMatch) {
    return null; // No regular expression match.
  }

  const { matchedLanguageCode, matchedCountryCode, matchedQuality } = directiveMatch;

  const languageCode = matchedLanguageCode.toLowerCase();
  const countryCode = matchedCountryCode ? matchedCountryCode.toUpperCase() : undefined;
  const quality = matchedQuality === undefined ? '1' : parseFloat(matchedQuality).toString(); // Remove trailing zeros.

  const locale = countryCode ? `${languageCode}-${countryCode}` : undefined;

  return { locale, languageCode, quality };
}
//
