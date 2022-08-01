/** Class to manage a locale identifier using the BCP 47 `language`-`country` format. */
export default class Locale {
  /** The locale identifier using the BCP 47 `language`-`country` case-normalized format. */
  public readonly identifier: string
  /** The ISO 639-1 alpha-2 language code. */
  public readonly languageCode: string
  /** The ISO 3166-1 alpha-2 country code. */
  public readonly countryCode: string

  /**
   * Is a given string a locale identifier following the BCP 47 `language`-`country` format.
   *
   * @param identifier - A potential locale identify to verify.
   * @param caseNormalized - Should we verify if the identifier is using the case-normalized format?
   */
  public static isLocale(identifier: string, caseNormalized = true): boolean {
    const regExp = new RegExp(/^[a-z]{2}-[A-Z]{2}$/, caseNormalized ? undefined : 'i')
    return regExp.test(identifier)
  }

  /**
   * Is a given string an ISO 639-1 alpha-2 language code.
   *
   * @param languageCode - An ISO 639-1 alpha-2 language code.
   * @param caseNormalized - Should we verify if the identifier is using the case-normalized format?
   */
  public static isLanguageCode(languageCode: string, caseNormalized = true): boolean {
    const regExp = new RegExp(/^[a-z]{2}$/, caseNormalized ? undefined : 'i')
    return regExp.test(languageCode)
  }

  /**
   * Is a given string an ISO 3166-1 alpha-2 country code.
   *
   * @param countryCode - An ISO 3166-1 alpha-2 country code.
   * @param caseNormalized - Should we verify if the identifier is using the case-normalized format?
   */
  public static isCountryCode(countryCode: string, caseNormalized = true): boolean {
    const regExp = new RegExp(/^[A-Z]{2}$/, caseNormalized ? undefined : 'i')
    return regExp.test(countryCode)
  }

  /**
   * Create a new `Locale` object.
   *
   * @param identifier - A locale identifier using the BCP 47 `language`-`country` format (case insensitive).
   *
   * @throws An error if the `identifier` format is invalid.
   */
  constructor(identifier: string) {
    if (!Locale.isLocale(identifier, false)) {
      throw new Error(`invalid locale identifier '${identifier}'`)
    }

    const [languageCode, countryCode] = identifier.split('-')

    this.languageCode = languageCode.toLowerCase()
    this.countryCode = countryCode.toUpperCase()
    this.identifier = `${this.languageCode}-${this.countryCode}`
  }
}
