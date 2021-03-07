"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const locale_1 = __importDefault(require("./locale"));
const locale_list_1 = __importDefault(require("./locale-list"));
const locale_quality_list_1 = __importDefault(require("./locale-quality-list"));
const language_quality_list_1 = __importDefault(require("./language-quality-list"));
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
function resolveAcceptLanguage(acceptLanguageHeader, supportedLocales, defaultLocale) {
    const localeList = new locale_list_1.default(supportedLocales);
    const defaultLocaleObject = new locale_1.default(defaultLocale);
    if (!localeList.locales.includes(defaultLocaleObject.code)) {
        throw new Error('default locale must be part of the supported locales');
    }
    if (!acceptLanguageHeader) {
        return defaultLocaleObject.code;
    }
    // Locales sorted by quality.
    const localesByQuality = new locale_quality_list_1.default();
    // Languages sorted by quality.
    const languagesByQuality = new language_quality_list_1.default();
    // Supported languages of unsupported locales sorted by quality.
    const localeLanguagesByQuality = new language_quality_list_1.default();
    const directives = acceptLanguageHeader
        .split(',')
        .map((directive) => directive.trim());
    for (const directive of directives) {
        // Based on RFC 2616, RFC 4647, RFC 5646 and RFC 7231.
        const directiveMatch = directive.match(/^((?<matchedLanguageCode>\*|([A-Z]{2}))((?<!\*)-(?<matchedCountryCode>[A-Z]{2}))?)(;q=(?<matchedQuality>1|0|0.[0-9]{1,3}))?$/i);
        if (directiveMatch) {
            const { locale, languageCode, quality } = getDirectiveDetails(directiveMatch, defaultLocaleObject);
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
            if (!localeList.locales.includes(locale) &&
                localeList.languages.includes(languageCode)) {
                localeLanguagesByQuality.add(quality, languageCode);
                continue;
            }
            // If the locale is supported, add the locale preference.
            localesByQuality.add(quality, locale);
        }
    }
    // console.log('localesByQuality');
    // console.dir(localesByQuality);
    // console.log('languagesByQuality');
    // console.dir(languagesByQuality);
    // console.log('localeLanguagesByQuality');
    // console.dir(localeLanguagesByQuality);
    if (!localesByQuality.isEmpty()) {
        // Return the matching locale with the highest quality.
        return localesByQuality.getTop();
    }
    else if (!languagesByQuality.isEmpty()) {
        // Return the matching locale with the language quality.
        return languagesByQuality.getTopFromLocaleList(localeList);
    }
    else if (!localeLanguagesByQuality.isEmpty()) {
        // Return the matching locale with the locale language quality.
        return localeLanguagesByQuality.getTopFromLocaleList(localeList);
    }
    return defaultLocaleObject.code;
}
exports.default = resolveAcceptLanguage;
/**
 * Get directive details from a regex match.
 *
 * @param directiveMatch Regex match result for an `Accept-Language` header directive.
 * @param defaultLocaleObject The default locale object used to normalize the result.
 *
 * @returns Parsed results from a matched `Accept-Language` header directive.
 */
function getDirectiveDetails(directiveMatch, defaultLocaleObject) {
    const { matchedLanguageCode, matchedCountryCode, matchedQuality, } = directiveMatch.groups;
    const languageCode = matchedLanguageCode == '*'
        ? defaultLocaleObject.languageCode
        : matchedLanguageCode.toLowerCase();
    const countryCode = matchedLanguageCode == '*'
        ? defaultLocaleObject.countryCode
        : matchedCountryCode
            ? matchedCountryCode.toUpperCase()
            : undefined;
    const quality = matchedQuality === undefined ? '1' : parseFloat(matchedQuality).toString(); // Remove trailing zeros.
    const locale = countryCode ? `${languageCode}-${countryCode}` : undefined;
    return { locale, languageCode, quality };
}
