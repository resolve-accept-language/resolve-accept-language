export default class Locale {
  /** The locale identifier using the `language`-`country` format. */
  public readonly identifier: string;
  /** The ISO 639-1 alpha-2 language code. */
  public readonly languageCode: string;
  /** The ISO 3166-1 alpha-2 country code. */
  public readonly countryCode: string;

  /**
   * Is a given string a locale identifier using the `language`-`country` format.
   *
   * @param identifier A locale identifier using the `language`-`country` format.
   * @param caseSensitive Is the case of the string sensitive? (`true` by default)
   */
  public static isLocale(identifier: string, caseSensitive = true): boolean {
    const regExp = new RegExp(/^[a-z]{2}-[A-Z]{2}$/, caseSensitive ? undefined : 'i');
    return regExp.test(identifier);
  }

  /**
   * Is a given string an ISO 639-1 alpha-2 language code.
   *
   * @param languageCode An ISO 639-1 alpha-2 language code.
   * @param caseSensitive Is the case of the string sensitive? (`true` by default)
   */
  public static isLanguageCode(languageCode: string, caseSensitive = true): boolean {
    const regExp = new RegExp(/^[a-z]{2}$/, caseSensitive ? undefined : 'i');
    return regExp.test(languageCode);
  }

  /**
   * Is a given string an ISO 3166-1 alpha-2 country code.
   *
   * @param countryCode An ISO 3166-1 alpha-2 country code.
   * @param caseSensitive Is the case of the string sensitive? (`true` by default)
   */
  public static isCountryCode(countryCode: string, caseSensitive = true): boolean {
    const regExp = new RegExp(/^[A-Z]{2}$/, caseSensitive ? undefined : 'i');
    return regExp.test(countryCode);
  }

  /**
   * Class to manage a locale identifer using the `language`-`country` format.
   *
   * @param identifier A locale identifier using the `language`-`country` format.
   *
   * @throws Will throw an error if the locale format is invalid.
   */
  constructor(identifier: string) {
    if (!Locale.isLocale(identifier, false)) {
      throw new Error(`invalid locale identifier '${identifier}'`);
    }

    const [languageCode, countryCode] = identifier.split('-');

    this.languageCode = languageCode.toLowerCase();
    this.countryCode = countryCode.toUpperCase();
    this.identifier = `${this.languageCode}-${this.countryCode}`;
  }
}
