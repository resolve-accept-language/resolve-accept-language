import AbstractQualityList from './abstract-quality-list';
import type LocaleList from './locale-list';

export default class LanguageQualityList extends AbstractQualityList {
  /**
   * Check if the value is accepted by the class implementation.
   *
   * @param value A value to add in the quality list.
   *
   * @returns True if the value is accepted, otherwise false.
   */
  protected valueIsAccepted(value: string): boolean {
    return /^[a-z]{2}$/.test(value);
  }

  /**
   * Get the top result from the list.
   *
   * @param localeList The list of locale from which the top language can be selected.
   *
   * @returns The top result (result with the highest quality).
   */
  public getTopFromLocaleList(localeList: LocaleList): string {
    const topLanguage = this.getTop();

    return (
      localeList.objects.find(
        ({ languageCode }) => languageCode === topLanguage
      )?.identifier || ''
    );
  }
}
