import Locale from './locale'

export default class LocaleList<TLocales extends readonly string[]> {
  /** A set of ISO 3166-1 alpha-2 country codes. */
  public readonly countries: Set<string> = new Set()
  /** A set of ISO 639-1 alpha-2 language codes. */
  public readonly languages: Set<string> = new Set()
  /** A set of locale identifiers using the BCP 47 `language`-`country` case-normalized format. */
  public readonly locales: Set<string> = new Set()
  /** A list of locale objects. */
  public readonly objects: Locale[] = []

  /**
   * Create a list of locale identifiers.
   *
   * @param locales - An array of locale identifiers using the BCP 47 `language`-`country` format.
   *
   * @throws Will throw an error if one of the locale's format is invalid.
   */
  constructor(locales: TLocales extends string[] ? TLocales[number][] : TLocales) {
    locales.forEach((locale) => {
      const localeObject = new Locale(locale)
      if (!this.locales.has(localeObject.identifier)) {
        this.objects.push(localeObject)
        this.locales.add(localeObject.identifier)
        this.languages.add(localeObject.languageCode)
        this.countries.add(localeObject.countryCode)
      }
    })
  }
}
