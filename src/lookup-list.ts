import Locale from './locale';
import type LocaleList from './locale-list';

/** An object where the properties are quality (in string format) and their value a set of strings. */
type DataObject = Record<string, Set<string>>;

export default class LookupList {
  /** Data object where the properties are quality (in string format) and their values a set containing locale
   * identifiers using the `language`-`country` format and ISO 639-1 alpha-2 language code. */
  private localesAndLanguagesByQuality: DataObject = {};
  /** Data object where the properties are quality (in string format) and their value a set of ISO 639-1 alpha-2
   * language code. */
  private unsupportedLocaleLanguagesByQuality: DataObject = {};

  /**
   * Add a locale in the data object matching its quality.
   *
   * @param quality The HTTP quality factor associated with a locale.
   * @param identifier A locale identifier using the `language`-`country` format.
   */
  public addLocale(quality: string, identifier: string): void {
    if (!Locale.isLocale(identifier)) {
      throw new Error(`invalid locale identifier '${identifier}'`);
    }
    if (!this.localesAndLanguagesByQuality[quality]) {
      this.localesAndLanguagesByQuality[quality] = new Set();
    }
    this.localesAndLanguagesByQuality[quality].add(identifier);
  }

  /**
   * Add a language in the data object matching its quality.
   *
   * @param quality The HTTP quality factor associated with a language.
   * @param languageCode An ISO 639-1 alpha-2 language code.
   */
  public addLanguage(quality: string, languageCode: string): void {
    if (!Locale.isLanguageCode(languageCode)) {
      throw new Error(`invalid ISO 639-1 alpha-2 language code '${languageCode}'`);
    }
    if (!this.localesAndLanguagesByQuality[quality]) {
      this.localesAndLanguagesByQuality[quality] = new Set();
    }
    this.localesAndLanguagesByQuality[quality].add(languageCode);
  }

  /**
   * Add an unsupported locale's language in the data object matching its quality.
   *
   * @param quality The HTTP quality factor associated with an unsupported locale's language.
   * @param languageCode An ISO 639-1 alpha-2 language code.
   */
  public addUnsupportedLocaleLanguage(quality: string, languageCode: string): void {
    if (!Locale.isLanguageCode(languageCode)) {
      throw new Error(`invalid ISO 639-1 alpha-2 language code '${languageCode}'`);
    }
    if (!this.unsupportedLocaleLanguagesByQuality[quality]) {
      this.unsupportedLocaleLanguagesByQuality[quality] = new Set();
    }
    this.unsupportedLocaleLanguagesByQuality[quality].add(languageCode);
  }

  /**
   * Get the best locale match from the lookup list.
   *
   * @param localeList The list of locale from which the top language can be selected.
   * @param defaultLocale The default locale object when no match is found.
   *
   * @returns The best match when found, otherwise the default locale identifier.
   */
  public getBestMatch(localeList: LocaleList, defaultLocale: Locale): string {
    let bestMatch: string | undefined;

    // Check if there is any matching locale identifiers or language code.
    if (Object.entries(this.localesAndLanguagesByQuality).length) {
      const localeOrLanguage = Object.entries(this.localesAndLanguagesByQuality)
        .sort()
        .reverse()[0][1]
        .values()
        .next().value as string;
      if (Locale.isLocale(localeOrLanguage)) {
        bestMatch = localeOrLanguage;
      } else {
        // The value is a language code.
        if (localeOrLanguage !== defaultLocale.languageCode) {
          // Only search for a match if the language does not match the default locale's.
          bestMatch = localeList.objects.find(
            ({ languageCode }) => languageCode === localeOrLanguage
          )?.identifier;
        }
      }
    } else if (Object.entries(this.unsupportedLocaleLanguagesByQuality).length) {
      // Before using the default locale, check if one of the unsupported locale's language can be found.

      const unsupportedLocaleLanguage = Object.entries(this.unsupportedLocaleLanguagesByQuality)
        .sort()
        .reverse()[0][1]
        .values()
        .next().value as string;

      if (unsupportedLocaleLanguage !== defaultLocale.languageCode) {
        // Only search for a match if the language does not match the default locale's.
        bestMatch = localeList.objects.find(
          ({ languageCode }) => languageCode === unsupportedLocaleLanguage
        )?.identifier;
      }
    }

    // Return the best match or the default locale.
    return bestMatch ? bestMatch : defaultLocale.identifier;
  }
}
