/** An object representing an HTTP `Accept-Language` header directive. */
type Directive = {
  /** The ISO 639-1 alpha-2 language code. */
  languageCode: string
  /** The ISO 3166-1 alpha-2 country code. */
  countryCode?: string
  /** The locale identifier using the BCP 47 `language`-`country` in case-normalized format. */
  locale?: string
  /** The quality factor (default is 1; values can range from 0 to 1 with up to 3 decimals). */
  quality: number
}

/** A directive object including the position in its HTTP header. */
type IndexedDirective = Directive & {
  /** This is the position of the directive in the HTTP header. */
  headerPosition: number
}

/** A directive object including the position in its HTTP header and the locale. */
export type IndexedDirectiveWithLocale = IndexedDirective & {
  locale: string
}

/**
 * Get a directive object from a directive string.
 *
 * @param directiveString - The string representing a directive, extracted from the HTTP header.
 *
 * @returns A `Directive` object or `undefined` if the string's format is invalid.
 */
const getDirective = (directiveString: string): Directive | undefined => {
  /**
   * The regular expression is excluding certain directives due to the inability to configure those options in modern
   * browsers today (also those options seem unpractical):
   *
   * - The wildcard character "*", as per RFC 2616 (section 14.4), should match any unmatched language tag.
   * - Language tags that starts with a wildcard (e.g., "*-CA") should match the first supported locale of a country.
   * - A quality value equivalent to "0", as per RFC 2616 (section 3.9), should be considered as "not acceptable".
   * - We hardcode the support for the `419` UN M49 code (as country code) representing Latin America to support `es-419`.
   */
  const directiveMatch = directiveString.match(
    /^((?<matchedLanguageCode>([a-z]{2}))(-(?<matchedCountryCode>[a-z]{2}|419))?)(;q=(?<matchedQuality>(1(\.0{0,3})?)|(0(\.\d{0,3})?)))?$/i
  )

  if (!directiveMatch?.groups) {
    return undefined // No regular expression match.
  }

  const { matchedLanguageCode, matchedCountryCode, matchedQuality } = directiveMatch.groups

  const languageCode = matchedLanguageCode.toLowerCase()
  const countryCode = matchedCountryCode ? matchedCountryCode.toUpperCase() : undefined

  // Only `es-419` is supported in browsers - if any other languages are using `419` we filter them out.
  if (countryCode === '419' && languageCode !== 'es') {
    return undefined
  }

  const quality = matchedQuality === undefined ? 1 : Number.parseFloat(matchedQuality) // Remove trailing zeros.
  const locale = countryCode ? `${languageCode}-${countryCode}` : undefined

  return { languageCode, countryCode, locale, quality }
}

/**
 * Get a list of directives from an HTTP `Accept-Language` header.
 *
 * @param acceptLanguageHeader - The value of an HTTP request `Accept-Language` header (also known as a "language priority list").
 *
 * @returns A list of `IndexedDirective` objects sorted by quality and header position.
 */
export const getDirectives = (acceptLanguageHeader: string): IndexedDirective[] => {
  const directives: IndexedDirective[] = []
  let headerPosition = 0
  acceptLanguageHeader.split(',').forEach((directiveString) => {
    const directive = getDirective(directiveString.trim())
    // Filter out invalid directives.
    if (!directive) {
      return
    }
    // Filter out duplicate directives (the first one takes precedence).
    if (
      !directives.some(
        (existingDirective) =>
          existingDirective.languageCode === directive.languageCode &&
          existingDirective.locale === directive.locale
      )
    ) {
      directives.push({ ...directive, headerPosition })
      headerPosition++
    }
  })

  // Post-processing to replace `es-419` by proper locales.
  const es419DirectiveIndex = directives.findIndex((directive) => directive.locale === 'es-419')

  if (es419DirectiveIndex >= 0) {
    // Remove 'es-419' from the directive.
    const es419Directive = directives[es419DirectiveIndex]

    // Replace `es-419` by the common Latin American spanish variants supported by browsers.
    const latinAmericanLocales = [
      'es-AR', // Spanish Argentina
      'es-CL', // Spanish Chile
      'es-CO', // Spanish Colombia
      'es-CR', // Spanish Costa Rica
      'es-HN', // Spanish Honduras
      'es-MX', // Spanish Mexico
      'es-PE', // Spanish Peru
      'es-US', // Spanish United States
      'es-UY', // Spanish Uruguay
      'es-VE', // Spanish Venezuela
    ]

    // Create new directives for each Latin American locale.
    const es419LocaleDirectives = latinAmericanLocales.map<IndexedDirective>((locale) => ({
      ...es419Directive,
      locale,
    }))

    // Replace 'es-419' directive with new directives in the exact same position.
    directives.splice(es419DirectiveIndex, 1, ...es419LocaleDirectives)
  }

  // Return the sorted directives by quality and header position.
  return directives.sort((a, b) => {
    // Compare quality values first.
    const qualityComparison = b.quality - a.quality
    if (qualityComparison) {
      return qualityComparison
    }

    // If quality values are equal, compare the header position.
    return a.headerPosition - b.headerPosition
  })
}
