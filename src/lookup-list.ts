import LocaleList from './locale-list'

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
export default class LookupList {
  /** The list of locales used to get the match during the lookup. */
  private localeList: LocaleList
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
  constructor(acceptLanguageHeader: string, locales: string[]) {
    this.localeList = new LocaleList(locales)

    const directiveStrings = acceptLanguageHeader
      .split(',')
      .map((directiveString) => directiveString.trim())

    for (const directiveString of directiveStrings) {
      const directive = this.getDirective(directiveString)

      if (directive === undefined) continue // No match for this directive.

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
   * Get the top (highest-ranked) locale by language.
   *
   * @param languageCode - An ISO 639-1 alpha-2 language code.
   *
   * @returns The top locale with the specified language.
   */
  public getTopByLanguage(languageCode: string): string | undefined {
    return this.localeList.objects.find((locale) => locale.languageCode === languageCode)
      ?.identifier
  }

  /**
   * Get the top (highest-ranked) locale or language.
   *
   * @returns The top match, which can either be a locale or a language.
   */
  public getTopLocaleOrLanguage(): string | undefined {
    const localesAndLanguagesByQuality = Object.entries(this.localesAndLanguagesByQuality)

    if (localesAndLanguagesByQuality.length === 0) {
      return undefined
    }

    return this.getTop(localesAndLanguagesByQuality)
  }

  /**
   * Get the top (highest-ranked) related locale.
   *
   * @returns The top related locale.
   */
  public getTopRelatedLocale(): string | undefined {
    const relatedLocaleLanguagesByQuality = Object.entries(this.relatedLocaleLanguagesByQuality)

    if (relatedLocaleLanguagesByQuality.length === 0) {
      return undefined
    }

    const topRelatedLocaleLanguage = this.getTop(relatedLocaleLanguagesByQuality)

    return this.getTopByLanguage(topRelatedLocaleLanguage)
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
     * - Language tags that starts with a wildcard (e.g. "*-CA") should match the first supported locale of a country.
     * - A quality value equivalent to "0", as per RFC 2616 (section 3.9), should be considered as "not acceptable".
     */
    const directiveMatch = directiveString.match(
      /^((?<matchedLanguageCode>([a-z]{2}))(-(?<matchedCountryCode>[a-z]{2}))?)(;q=(?<matchedQuality>(1(\.0{0,3})?)|(0(\.\d{0,3})?)))?$/i
    )

    if (!directiveMatch?.groups) return undefined // No regular expression match.

    const { matchedLanguageCode, matchedCountryCode, matchedQuality } = directiveMatch.groups

    const languageCode = matchedLanguageCode.toLowerCase()
    const countryCode = matchedCountryCode ? matchedCountryCode.toUpperCase() : undefined
    const quality =
      matchedQuality === undefined ? '1' : Number.parseFloat(matchedQuality).toString() // Remove trailing zeros.

    const locale = countryCode ? `${languageCode}-${countryCode}` : undefined

    return { languageCode, locale, quality }
  }

  /**
   * Get the top (highest-ranked) entry from a dataset object entries.
   *
   * @param dataObjectEntries - The object entries of a dataset object.
   *
   * @returns The top entry from a dataset object entries.
   */
  private getTop(dataObjectEntries: [string, Set<string>][]): string {
    return dataObjectEntries.sort().reverse()[0][1].values().next().value as string
  }
}
