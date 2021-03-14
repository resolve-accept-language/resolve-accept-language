export default class Locale {
  /** The locale identifier using the `language`-`country` format. */
  public readonly identifier: string;
  /** The ISO 639-1 alpha-2 language code. */
  public readonly languageCode: string;
  /** The ISO 3166-1 alpha-2 country code. */
  public readonly countryCode: string;

  /**
   * Class to manage a locale identifer using the `language`-`country` format.
   *
   * @param identifier A locale identifier using the `language`-`country` format.
   *
   * @throws Will throw an error if the locale format is invalid.
   */
  constructor(identifier: string) {
    if (!identifier.includes('-')) {
      throw new Error(`invalid locale identifier '${identifier}'`);
    }

    const [languageCode, countryCode] = identifier.split('-');

    if (!/^[a-z]{2}$/i.test(languageCode)) {
      throw new Error(`invalid ISO 639-1 alpha-2 language code '${languageCode}' in ${identifier}`);
    }

    if (!/^[a-z]{2}$/i.test(countryCode)) {
      throw new Error(`invalid ISO 3166-1 alpha-2 country code '${countryCode}' in ${identifier}`);
    }

    this.languageCode = languageCode.toLowerCase();
    this.countryCode = countryCode.toUpperCase();
    this.identifier = `${this.languageCode}-${this.countryCode}`;
  }
}
