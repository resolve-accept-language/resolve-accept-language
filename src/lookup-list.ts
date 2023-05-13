import Locale from './locale'
import LocaleList from './locale-list'
import { NormalizeLocale } from './resolve-accept-language'

/** An object where the properties are quality (in string format) and their value a set of strings. */
type DataObject = Record<string, Set<string>>

/**
 * An object representing an HTTP `Accept-Language` header directive.
 *
 * @param languageCode - The ISO 639-1 alpha-2 language code.
 * @param locale - The locale identifier using the BCP 47 `language`-`country` case-normalized format.
 * @param quality - The quality factor (default is 1; values can range from 0 to 1 with up to 3 decimals)
 */
type Directive = {
  languageCode: string
  locale?: string
  quality: string
}

/** Lookup list used to match the preferred locale based on the value of an `Accept-Language` HTTP header. */
export default class LookupList<TLocales extends readonly string[]> {
  /** The list of locales used to get the match during the lookup. */
  private localeList: LocaleList<TLocales>
  /**
   * Data object where the properties are quality (in string format) and their values a set containing locale
   * identifiers using the `language`-`country` format and ISO 639-1 alpha-2 language code.
   */
  private localesAndLanguagesByQuality: DataObject = {}
  /**
   * Data object where the properties are quality (in string format) and their value a set of ISO 639-1 alpha-2
   * language code.
   */
  private relatedLocaleLanguagesByQuality: DataObject = {}

  /**
   * Create a new `LookupList` object.
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
    // Put the default locale first so that it will be more likely to be matched.
    this.localeList = new LocaleList([
      defaultLocale,
      ...locales.filter((locale) => locale !== defaultLocale),
    ])

    const directives = acceptLanguageHeader
      .split(',')
      .map((directiveString) => this.getDirective(directiveString.trim()))
      .filter((directive) => directive !== undefined) as Directive[]

    for (const directive of directives) {
      const { locale, languageCode, quality } = directive

      // If the language is not supported, skip to the next match.
      if (!this.localeList.languages.has(languageCode)) {
        continue
      }

      // If there is no country code (while the language is supported), add the language preference.
      if (!locale) {
        this.addLanguage(quality, languageCode)
        continue
      }

      // If the locale is not supported, but the locale's language is, add to locale language preference.
      if (!this.localeList.locales.has(locale) && this.localeList.languages.has(languageCode)) {
        this.addRelatedLocaleLanguage(quality, languageCode)
        continue
      }

      // If the locale is supported, add the locale preference.
      this.addLocale(quality, locale)
    }
  }

  /**
   * Get the top locale-based match if available.
   *
   * @returns The top locale-based match or undefined when there is no match.
   */
  public getLocaleBasedMatch(): NormalizeLocale<TLocales[number]> | undefined {
    const match = this.getMatch(this.localesAndLanguagesByQuality)
    return match && Locale.isLocale(match)
      ? (match as NormalizeLocale<TLocales[number]>)
      : undefined
  }

  /**
   * Get the language-based match if available.
   *
   * @returns The language-based match or undefined when there is no match.
   */
  public getLanguageBasedMatch(): NormalizeLocale<TLocales[number]> | undefined {
    const match = this.getMatch(this.localesAndLanguagesByQuality)
    return match && !Locale.isLocale(match)
      ? ((this.localeList.objects.find((locale) => locale.languageCode === match) as Locale)
          .identifier as NormalizeLocale<TLocales[number]>)
      : undefined
  }

  /**
   * Get the related-locale-based match if available.
   *
   * @returns The related-locale-based match or undefined when there is no match.
   */
  public getRelatedLocaleBasedMatch(): NormalizeLocale<TLocales[number]> | undefined {
    const match = this.getMatch(this.relatedLocaleLanguagesByQuality)
    return match
      ? ((this.localeList.objects.find((locale) => locale.languageCode === match) as Locale)
          .identifier as NormalizeLocale<TLocales[number]>)
      : undefined
  }

  /**
   * Add a language in the data object matching its quality.
   *
   * @param quality - The HTTP header's quality factor associated with a language.
   * @param languageCode - An ISO 639-1 alpha-2 language code.
   */
  private addLanguage(quality: string, languageCode: string): void {
    if (!this.localesAndLanguagesByQuality[quality]) {
      this.localesAndLanguagesByQuality[quality] = new Set()
    }
    this.localesAndLanguagesByQuality[quality].add(languageCode)
  }

  /**
   * Add a locale in the data object matching its quality.
   *
   * @param quality - The HTTP header's quality factor associated with a locale.
   * @param identifier - A locale identifier using the BCP 47 `language`-`country` case-normalized format.
   */
  private addLocale(quality: string, identifier: string): void {
    if (!this.localesAndLanguagesByQuality[quality]) {
      this.localesAndLanguagesByQuality[quality] = new Set()
    }
    this.localesAndLanguagesByQuality[quality].add(identifier)
  }

  /**
   * Add a related locale's language in the data object matching its quality.
   *
   * @param quality - The HTTP header's quality factor associated with a related locale's language.
   * @param languageCode - An ISO 639-1 alpha-2 language code.
   */
  private addRelatedLocaleLanguage(quality: string, languageCode: string): void {
    if (!this.relatedLocaleLanguagesByQuality[quality]) {
      this.relatedLocaleLanguagesByQuality[quality] = new Set()
    }
    this.relatedLocaleLanguagesByQuality[quality].add(languageCode)
  }

  /**
   * Get a directive object from a directive string.
   *
   * @param directiveString - The string representing a directive, extracted from the HTTP header.
   *
   * @returns A `Directive` object or `undefined` if the string's format is invalid.
   */
  private getDirective(directiveString: string): Directive | undefined {
    /**
     * The regular expression is excluding certain directives due to the inability to configure those options in modern
     * browsers today (also those options seem unpractical):
     *
     * - The wildcard character "*", as per RFC 2616 (section 14.4), should match any unmatched language tag.
     * - Language tags that starts with a wildcard (e.g., "*-CA") should match the first supported locale of a country.
     * - A quality value equivalent to "0", as per RFC 2616 (section 3.9), should be considered as "not acceptable".
     */
    const directiveMatch = directiveString.match(
      /^((?<matchedLanguageCode>([a-z]{2}))(-(?<matchedCountryCode>[a-z]{2}))?)(;q=(?<matchedQuality>(1(\.0{0,3})?)|(0(\.\d{0,3})?)))?$/i
    )

    if (!directiveMatch?.groups) {
      return undefined // No regular expression match.
    }

    const { matchedLanguageCode, matchedCountryCode, matchedQuality } = directiveMatch.groups
    const languageCode = matchedLanguageCode.toLowerCase()
    const countryCode = matchedCountryCode ? matchedCountryCode.toUpperCase() : undefined
    const quality =
      matchedQuality === undefined ? '1' : Number.parseFloat(matchedQuality).toString() // Remove trailing zeros.
    const locale = countryCode ? `${languageCode}-${countryCode}` : undefined

    return { languageCode, locale, quality }
  }

  /**
   * Get a match from a data object.
   *
   * @param dataObject - A data object.
   *
   * @returns A match or undefined when there is no match.
   */
  private getMatch(dataObject: DataObject): string | undefined {
    const dataObjectEntries = Object.entries(dataObject)

    return dataObjectEntries.length === 0
      ? undefined
      : (dataObjectEntries.sort().reverse()[0][1].values().next().value as string)
  }
}
