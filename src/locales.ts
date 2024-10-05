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
  /** A set of ISO 639-1 alpha-2 language codes. */
  public readonly languages: Set<string> = new Set()
  /** A set of ISO 3166-1 alpha-2 country codes. */
  public readonly countries: Set<string> = new Set()
  /** A set of locale identifiers using the BCP 47 `language`-`country` case-normalized format. */
  public readonly locales: Set<string> = new Set()
  /** A list of locale objects. */
  public readonly objects: Locale[] = []

  /**
   * Create a list of locale identifiers.
   *
   * @param locales - An set of unique locale identifiers using the BCP 47 `language`-`country` format (case insensitive).
   *
   * @throws Will throw an error if one of the locale's format is invalid.
   */
  constructor(locales: Set<string>) {
    locales.forEach((locale) => {
      const localeObject = new Locale(locale)
      this.objects.push(localeObject)
      this.locales.add(localeObject.identifier)
      this.languages.add(localeObject.languageCode)
      this.countries.add(localeObject.countryCode)
    })
  }
}

/**
 * Is a given string a locale identifier following the BCP 47 `language`-`country` format.
 *
 * @param identifier - A potential locale identify to verify.
 * @param caseNormalized - Should we verify if the identifier is using the case-normalized format?
 */
export const isLocale = (identifier: string, caseNormalized = true): boolean =>
  new RegExp('^[a-z]{2}-[A-Z]{2}$', caseNormalized ? '' : 'i').test(identifier)
