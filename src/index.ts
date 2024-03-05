import { IndexedDirectiveWithLocale, getDirectives } from './directives'
import { Locale, LocaleList, isLocale } from './locales'

/** The type of matches. */
export type MatchType =
  | 'locale'
  | 'languageSpecificLocale'
  | 'language'
  | 'relatedLocale'
  | 'defaultLocale'

/** The type of matches enumeration. */
export const MATCH_TYPES: {
  readonly [K in MatchType]: K
} = {
  locale: 'locale',
  languageSpecificLocale: 'languageSpecificLocale',
  language: 'language',
  relatedLocale: 'relatedLocale',
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
}

type Result<
  Locales extends string[],
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
  Locales extends string[],
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
  const normalizedDefaultLocale = new Locale(defaultLocale).identifier

  // Put the default locale first so that it will be more likely to be matched.
  const normalizedLocales = new Set([
    normalizedDefaultLocale,
    ...locales.map((locale) => new Locale(locale).identifier),
  ])

  const match = ((): { match: string; matchType: MatchType } => {
    const localeList = new LocaleList(normalizedLocales)
    const directiveList = getDirectives(acceptLanguageHeader)

    // Do a first loop on the directives for locale, language-specific locale and language matches.
    for (const directive of directiveList) {
      const { locale, languageCode } = directive

      // Continue to the next directive if the language is not supported.
      if (!localeList.languages.has(languageCode)) {
        continue
      }

      // Try to do a locale match.
      if (locale !== undefined) {
        if (localeList.locales.has(locale)) {
          return { match: locale, matchType: MATCH_TYPES.locale }
        }

        // Continue to the next directive if the locale is not supported.
        continue
      }

      // Try to do a language specific locale match.
      const matchingLanguageLocale = directiveList.find(
        (directive): directive is IndexedDirectiveWithLocale =>
          directive.languageCode === languageCode &&
          directive.locale !== undefined &&
          localeList.locales.has(directive.locale)
      )

      if (matchingLanguageLocale) {
        return {
          match: matchingLanguageLocale.locale,
          matchType: MATCH_TYPES.languageSpecificLocale,
        }
      }

      // Try to do a language match.
      const languageMatch = localeList.objects.find(
        (locale) => locale.languageCode === languageCode
      )
      if (languageMatch) {
        return {
          match: languageMatch.identifier,
          matchType: MATCH_TYPES.language,
        }
      }
    }

    // Do a second loop on the directive for related locale matches.
    for (const directive of directiveList) {
      // Continue to the next directive if the language is not supported.
      if (!localeList.languages.has(directive.languageCode)) {
        continue
      }

      const relatedLocale = localeList.objects.find(
        (locale) => locale.languageCode === directive.languageCode
      )

      if (relatedLocale) {
        return {
          match: relatedLocale.identifier,
          matchType: MATCH_TYPES.relatedLocale,
        }
      }
    }

    return {
      match: normalizedDefaultLocale,
      matchType: MATCH_TYPES.defaultLocale,
    }
  })()

  return (options?.returnMatchType ? match : match.match) as Result<Locales, WithMatchType>
}
