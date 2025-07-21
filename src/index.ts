import { IndexedDirectiveWithLocale, getDirectives } from './directives'
import { Locale, LocaleList, isLocale } from './locales'

/** The type of matches. */
export type MatchType =
  | 'locale'
  | 'languageSpecificLocale'
  | 'language'
  | 'relatedLocale'
  | 'languageCountry'
  | 'country'
  | 'defaultLocale'

/** The type of matches enumeration. */
export const MATCH_TYPES: {
  readonly [K in MatchType]: K
} = {
  locale: 'locale',
  languageSpecificLocale: 'languageSpecificLocale',
  language: 'language',
  relatedLocale: 'relatedLocale',
  languageCountry: 'languageCountry',
  country: 'country',
  defaultLocale: 'defaultLocale',
} as const

/** Type to normalize the locale format. */
export type NormalizeLocale<Remainder extends string> =
  Remainder extends `${infer LanguageCode}-${infer CountryCode}`
    ? `${Lowercase<LanguageCode>}-${Uppercase<CountryCode>}`
    : Remainder

/** Additional options to apply. */
type Options<WithMatchType extends boolean | undefined> = {
  /** Should the match type be returned? */
  returnMatchType?: WithMatchType
  /** Should the country of the locale be used for matching? */
  matchCountry?: boolean
}

type Result<
  Locales extends readonly string[],
  WithMatchType extends boolean | undefined,
> = WithMatchType extends true
  ? {
      /** The best locale match. */
      match: NormalizeLocale<Locales[number]>
      /** The type of match. */
      matchType: MatchType
    }
  : /** The best locale match. */
    NormalizeLocale<Locales[number]>

/**
 * Resolve the preferred locale from an HTTP `Accept-Language` header.
 *
 * All locale identifiers provided as parameters must following the BCP 47 `language`-`country` (case insensitive).
 *
 * @param acceptLanguageHeader - The value of an HTTP request `Accept-Language` header (also known as a "language priority list").
 * @param locales - An array of locale identifiers that must include the default locale. The order will be used for matching where
 * the first identifier will be more likely to be matched than the last identifier.
 * @param defaultLocale - The default locale identifier when no match is found.
 * @param options - Additional options to apply.
 *
 * @returns Either the best locale match or a match object, depending on options.
 *
 * @example
 * // returns 'fr-CA'
 * resolveAcceptLanguage(
 *   'fr-CA;q=0.01,en-CA;q=0.1,en-US;q=0.001',
 *   ['en-US', 'fr-CA'],
 *   'en-US'
 * )
 */
export const resolveAcceptLanguage = <
  Locales extends readonly string[],
  WithMatchType extends boolean | undefined = undefined,
>(
  acceptLanguageHeader: string,
  locales: Locales,
  defaultLocale: Locales[number],
  options?: Options<WithMatchType>
): Result<Locales, WithMatchType> => {
  // Check if the locales are valid.
  locales.forEach((locale) => {
    if (!isLocale(locale, false)) {
      throw new Error(
        `Invalid locale identifier '${locale}'. A valid locale should follow the BCP 47 'language-country' format.`
      )
    }
  })

  // Check if the default locale is valid.
  if (!isLocale(defaultLocale, false)) {
    throw new Error(
      `Invalid default locale identifier '${defaultLocale}'. A valid locale should follow the BCP 47 'language-country' format.`
    )
  }

  // Check if the default locale is included in the locales.
  if (!locales.some((locale) => locale.toLowerCase() === defaultLocale.toLowerCase())) {
    throw new Error(
      `The default locale '${defaultLocale}' must be included in the locales array because it is used as a fallback when no match is found.`
    )
  }

  // Normalize all locales.
  const defaultLocaleObject = new Locale(defaultLocale)

  // Put the default locale first so that it will be more likely to be matched.
  const normalizedLocales = new Set([
    defaultLocaleObject.identifier,
    ...locales.map((locale) => new Locale(locale).identifier),
  ])

  const match = ((): { match: string; matchType: MatchType } => {
    const localeList = new LocaleList(normalizedLocales)
    const directives = getDirectives(acceptLanguageHeader)
    const supportedLanguageDirectives = directives.filter((directive) =>
      localeList.languages.has(directive.languageCode)
    )

    // Do a first loop on the directives for locale, language-specific locale and language matches.
    for (const directive of supportedLanguageDirectives) {
      const { locale, languageCode } = directive

      // Try to do a locale match.
      if (locale !== undefined) {
        if (localeList.locales.has(locale)) {
          return { match: locale, matchType: MATCH_TYPES.locale }
        }

        // Continue to the next directive if the locale is not supported.
        continue
      }

      // Try to do a language specific locale match.
      const languageSpecificLocaleMatch = directives.find(
        (directive): directive is IndexedDirectiveWithLocale =>
          directive.languageCode === languageCode &&
          directive.locale !== undefined &&
          localeList.locales.has(directive.locale)
      )

      if (languageSpecificLocaleMatch) {
        return {
          match: languageSpecificLocaleMatch.locale,
          matchType: MATCH_TYPES.languageSpecificLocale,
        }
      }

      // Try to do a language match.
      for (const locale of localeList.objects) {
        if (locale.languageCode === languageCode) {
          return {
            match: locale.identifier,
            matchType: MATCH_TYPES.language,
          }
        }
      }
    }

    // Do a second loop on the directive to try to do a related locale match.
    for (const directive of supportedLanguageDirectives) {
      for (const locale of localeList.objects) {
        if (locale.languageCode === directive.languageCode) {
          return {
            match: locale.identifier,
            matchType: MATCH_TYPES.relatedLocale,
          }
        }
      }
    }

    // Do a third loop on the directive to try to do a language country match.
    const alternativeDefaultCountries = localeList.objects
      .filter(
        (locale) =>
          locale.languageCode === defaultLocaleObject.languageCode &&
          locale.identifier !== defaultLocaleObject.identifier
      )
      .map((locale) => locale.countryCode)

    if (alternativeDefaultCountries.length > 0) {
      for (const directive of directives) {
        if (
          directive.locale !== undefined &&
          directive.countryCode !== undefined &&
          alternativeDefaultCountries.includes(directive.countryCode)
        ) {
          return {
            match: `${defaultLocaleObject.languageCode}-${directive.countryCode}`,
            matchType: MATCH_TYPES.languageCountry,
          }
        }
      }
    }

    // Optionally do a fourth loop on the directive to try to do a country match.
    if (options?.matchCountry) {
      for (const directive of directives) {
        for (const locale of localeList.objects) {
          if (locale.countryCode === directive.countryCode) {
            return {
              match: locale.identifier,
              matchType: MATCH_TYPES.country,
            }
          }
        }
      }
    }

    return {
      match: defaultLocaleObject.identifier,
      matchType: MATCH_TYPES.defaultLocale,
    }
  })()

  return (options?.returnMatchType ? match : match.match) as Result<Locales, WithMatchType>
}
