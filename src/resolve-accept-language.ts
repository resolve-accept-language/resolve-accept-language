import Locale from './locale'
import LookupList from './lookup-list'

/** Resolve the preferred locale from an HTTP `Accept-Language` header. */
export class ResolveAcceptLanguage {
  /** The language-based match, if applicable. */
  private languageBasedMatch: string | undefined
  /** The locale-based match, if applicable. */
  private localeBasedMatch: string | undefined
  /** The related-locale-based match, if applicable. */
  private relatedLocaleBasedMatch: string | undefined

  /**
   * Create a new `ResolveAcceptLanguage` object.
   *
   * All locale identifiers provided as parameters must following the BCP 47 `language`-`country` (case insensitive).
   *
   * @param acceptLanguageHeader - The value of an HTTP request `Accept-Language` header (also known as a "language priority list").
   * @param locales - An array of locale identifiers. The order will be used for matching where the first identifier will be more
   * likely to be matched than the last identifier.
   */
  constructor(acceptLanguageHeader: string, locales: string[]) {
    const lookupList = new LookupList(acceptLanguageHeader, locales)

    const topLocaleOrLanguage = lookupList.getTopLocaleOrLanguage()

    if (topLocaleOrLanguage === undefined) {
      this.relatedLocaleBasedMatch = lookupList.getTopRelatedLocale()
    } else {
      if (Locale.isLocale(topLocaleOrLanguage)) {
        this.localeBasedMatch = topLocaleOrLanguage
      } else {
        this.languageBasedMatch = lookupList.getTopByLanguage(topLocaleOrLanguage)
      }
    }
  }

  /**
   * Is the best match language-based?
   *
   * @returns True if the best match language-based, otherwise false.
   */
  public bestMatchIsLanguageBased(): boolean {
    return this.languageBasedMatch !== undefined
  }

  /**
   * Is the best match locale-based?
   *
   * @returns True if the best match locale-based, otherwise false.
   */
  public bestMatchIsLocaleBased(): boolean {
    return this.localeBasedMatch !== undefined
  }

  /**
   * Is the best match related-locale-based?
   *
   * @returns True if the best match related-locale-based, otherwise false.
   */
  public bestMatchIsRelatedLocaleBased(): boolean {
    return this.relatedLocaleBasedMatch !== undefined
  }

  /**
   * Get the locale which was the best match.
   *
   * @returns The locale which was the best match.
   */
  public getBestMatch(): string | undefined {
    return this.localeBasedMatch ?? this.languageBasedMatch ?? this.relatedLocaleBasedMatch
  }

  /**
   * Was a match found when resolving the preferred locale?
   *
   * @returns True when a match is found, otherwise false.
   */
  public hasMatch(): boolean {
    return this.getBestMatch() === undefined ? false : true
  }

  /**
   * Did the resolution of the preferred locale find no match?
   *
   * @returns True when there is no match, otherwise false.
   */
  public hasNoMatch(): boolean {
    return !this.hasMatch()
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
const resolveAcceptLanguage = (
  acceptLanguageHeader: string,
  locales: string[],
  defaultLocale: string
): string => {
  let localesIncludeDefault = false

  locales.forEach((locale) => {
    if (!Locale.isLocale(locale, false)) {
      throw new Error(`invalid locale identifier '${locale}'`)
    }
    if (locale.toLowerCase() === defaultLocale.toLocaleLowerCase()) {
      localesIncludeDefault = true
    }
  })
  if (!Locale.isLocale(defaultLocale, false)) {
    throw new Error(`invalid default locale identifier '${defaultLocale}'`)
  }
  if (!localesIncludeDefault) {
    throw new Error('the default locale must be included in the locales')
  }

  const rankedLocales = [defaultLocale, ...locales.filter((locale) => locale !== defaultLocale)]

  const resolveAcceptLanguage = new ResolveAcceptLanguage(acceptLanguageHeader, rankedLocales)

  if (resolveAcceptLanguage.hasMatch()) {
    return resolveAcceptLanguage.getBestMatch() as string
  }

  return new Locale(defaultLocale).identifier
}

export default resolveAcceptLanguage
