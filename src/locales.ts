/** Class to manage a locale identifier using the BCP 47 `language`-`country` format. */
export class Locale {
  /** The ISO 639-1 alpha-2 language code. */
  public readonly languageCode: string
  /** The ISO 3166-1 alpha-2 country code. */
  public readonly countryCode: string
  /** The locale identifier using the BCP 47 `language`-`country` case-normalized format. */
  public readonly identifier: string

  /**
   * Create a new `Locale` object.
   *
   * @param identifier - A locale identifier using the BCP 47 `language`-`country` format (case insensitive).
   *
   * @throws An error if the `identifier` format is invalid.
   */
  constructor(identifier: string) {
    if (!isLocale(identifier, false)) {
      throw new Error(`invalid locale identifier '${identifier}'`)
    }

    const [languageCode, countryCode] = identifier.split('-')

    this.languageCode = languageCode.toLowerCase()
    this.countryCode = countryCode.toUpperCase()
    this.identifier = `${this.languageCode}-${this.countryCode}`
  }
}

export class LocaleList {
  /** A lookup of ISO 639-1 alpha-2 language codes. */
  public readonly languages: Record<string, boolean> = {}
  /** A lookup of ISO 3166-1 alpha-2 country codes. */
  public readonly countries: Record<string, boolean> = {}
  /** A lookup of locale identifiers using the BCP 47 `language`-`country` case-normalized format. */
  public readonly locales: Record<string, boolean> = {}
  /** A list of locale objects. */
  public readonly objects: Locale[] = []

  /**
   * Create a list of locale identifiers.
   *
   * @param locales - A list of locale identifiers using the BCP 47 `language`-`country` format (case insensitive).
   *
   * @throws Will throw an error if one of the locale's format is invalid.
   */
  constructor(locales: string[]) {
    for (const locale of locales) {
      const localeObject = new Locale(locale)
      if (localeObject.identifier in this.locales) {
        continue // Skip duplicates.
      }
      this.objects.push(localeObject)
      this.locales[localeObject.identifier] = true
      this.languages[localeObject.languageCode] = true
      this.countries[localeObject.countryCode] = true
    }
  }
}

/** Matches a locale identifier in case-normalized format (lowercase language, uppercase country). */
const REGEX_LOCALE_CASE_NORMALIZED = /^[a-z]{2}-[A-Z]{2}$/

/** Matches a locale identifier in any case format. */
const REGEX_LOCALE_CASE_INSENSITIVE = /^[a-z]{2}-[A-Z]{2}$/i

/**
 * Is a given string a locale identifier following the BCP 47 `language`-`country` format.
 *
 * @param identifier - A potential locale identify to verify.
 * @param caseNormalized - Should we verify if the identifier is using the case-normalized format?
 */
export const isLocale = (identifier: string, caseNormalized = true): boolean =>
  (caseNormalized ? REGEX_LOCALE_CASE_NORMALIZED : REGEX_LOCALE_CASE_INSENSITIVE).test(identifier)
