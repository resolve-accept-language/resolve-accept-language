import Locale from './locale';

export default class LocaleList {
  /** A list of locale objects. */
  public readonly objects: Locale[] = [];
  /** A list of BCP47 locale codes using the `language`-`country` format. */
  public readonly locales: string[] = [];
  /** A list of ISO 639-1 alpha-2 language codes. */
  public readonly languages: string[] = [];
  /** A list of ISO 3166-1 alpha-2 country codes. */
  public readonly counties: string[] = [];

  /**
   * LocaleList constructor.
   *
   * @param locales An array of BCP47 locale code using the `language`-`country` format.
   *
   * @throws Will throw an error if one of the locales format is invalid.
   */
  constructor(locales: string[]) {
    for (const locale of locales) {
      const localeObject = new Locale(locale);

      if (!this.locales.includes(localeObject.code)) {
        this.locales.push(localeObject.code);
        this.objects.push(localeObject);
      }

      if (!this.languages.includes(localeObject.languageCode)) {
        this.languages.push(localeObject.languageCode);
      }

      if (!this.counties.includes(localeObject.countryCode)) {
        this.counties.push(localeObject.countryCode);
      }
    }
  }
}
