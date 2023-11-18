import Locale from './locale'
import LookupList from './lookup-list'

/** The type matches. */
export type MatchType = 'localeBased' | 'languageBased' | 'relatedLocaleBased' | 'defaultLocale'

/** Match type enumeration. */
export const MATCH_TYPES: {
  readonly [K in MatchType]: K
} = {
  localeBased: 'localeBased',
  languageBased: 'languageBased',
  relatedLocaleBased: 'relatedLocaleBased',
  defaultLocale: 'defaultLocale',
}

/** Type to normalize the locale format. */
export type NormalizeLocale<Remainder extends string> =
  Remainder extends `${infer LanguageCode}-${infer CountryCode}`
    ? `${Lowercase<LanguageCode>}-${Uppercase<CountryCode>}`
    : Remainder

/** Resolve the preferred locale from an HTTP `Accept-Language` header. */
export class ResolveAcceptLanguage<TLocales extends readonly string[] = string[]> {
  /** The default locale. */
  private defaultLocale: NormalizeLocale<TLocales[number]>

  /** The locale-based match, if applicable. */
  private localeBasedMatch: NormalizeLocale<TLocales[number]> | undefined
  /** The language-based match, if applicable. */
  private languageBasedMatch: NormalizeLocale<TLocales[number]> | undefined
  /** The related-locale-based match, if applicable. */
  private relatedLocaleBasedMatch: NormalizeLocale<TLocales[number]> | undefined

  /**
   * Create a new `ResolveAcceptLanguage` object.
   *
   * All locale identifiers provided as parameters must following the BCP 47 `language`-`country` (case insensitive).
   *
   * @param acceptLanguageHeader - The value of an HTTP request `Accept-Language` header (also known as a "language priority list").
   * @param locales - An array of locale identifiers. The order will be used for matching where the first identifier will be more
   * likely to be matched than the last identifier.
   */
  constructor(
    acceptLanguageHeader: string,
    locales: TLocales extends string[] ? TLocales[number][] : TLocales,
    defaultLocale: TLocales[number]
  ) {
    // Check if the locales are valid.
    locales.forEach((locale) => {
      if (!Locale.isLocale(locale, false)) {
        throw new Error(`invalid locale identifier '${locale}'`)
      }
    })

    // Check if the default locale is valid.
    if (!Locale.isLocale(defaultLocale, false)) {
      throw new Error(`invalid default locale identifier '${defaultLocale}'`)
    }

    // Check if the default locale is included in the locales.
    if (!locales.some((locale) => locale.toLowerCase() === defaultLocale.toLowerCase())) {
      throw new Error('the default locale must be included in the locales')
    }

    this.defaultLocale = new Locale(defaultLocale).identifier as NormalizeLocale<TLocales[number]>
    const lookupList = new LookupList(acceptLanguageHeader, locales, defaultLocale)

    // Check if the match if locale based.
    this.localeBasedMatch = lookupList.getLocaleBasedMatch()
    if (this.localeBasedMatch) {
      return
    }

    // Check if the match is language based.
    this.languageBasedMatch = lookupList.getLanguageBasedMatch()
    if (this.languageBasedMatch) {
      return
    }

    // Check if the match is related-locale based.
    this.relatedLocaleBasedMatch = lookupList.getRelatedLocaleBasedMatch()
    if (this.relatedLocaleBasedMatch) {
      return
    }
  }

  /**
   * Get the type of match.
   *
   * @returns The type of match.
   */
  public getMatchType(): MatchType {
    return this.localeBasedMatch
      ? MATCH_TYPES.localeBased
      : this.languageBasedMatch
        ? MATCH_TYPES.languageBased
        : this.relatedLocaleBasedMatch
          ? MATCH_TYPES.relatedLocaleBased
          : MATCH_TYPES.defaultLocale
  }

  /**
   * Get the matching locale.
   *
   * @returns The matching locale.
   */
  public getMatch(): NormalizeLocale<TLocales[number]> {
    return (
      this.localeBasedMatch ??
      this.languageBasedMatch ??
      this.relatedLocaleBasedMatch ??
      this.defaultLocale
    )
  }
}

/**
 * Resolve the preferred locale from an HTTP `Accept-Language` header.
 *
 * All locale identifiers provided as parameters must following the BCP 47 `language`-`country` (case insensitive).
 *
 * @param acceptLanguageHeader - The value of an HTTP request `Accept-Language` header (also known as a "language priority list").
 * @param locales - An array of locale identifiers that must include the default locale. The order will be used for matching where
 * the first identifier will be more likely to be matched than the last identifier.
 * @param defaultLocale - The default locale identifier when no match is found.
 *
 * @returns The locale identifier which was the best match, in case-normalized format.
 *
 * @example
 * // returns 'fr-CA'
 * resolveAcceptLanguage(
 *   'fr-CA;q=0.01,en-CA;q=0.1,en-US;q=0.001',
 *   ['en-US', 'fr-CA'],
 *   'en-US'
 * )
 */
const resolveAcceptLanguage = <TLocales extends readonly string[]>(
  acceptLanguageHeader: string,
  locales: TLocales extends string[] ? TLocales[number][] : TLocales,
  defaultLocale: TLocales[number]
): NormalizeLocale<TLocales[number]> => {
  return new ResolveAcceptLanguage(acceptLanguageHeader, locales, defaultLocale).getMatch()
}

export default resolveAcceptLanguage
