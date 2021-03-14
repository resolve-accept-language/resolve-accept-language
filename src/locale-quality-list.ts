import AbstractQualityList from './abstract-quality-list';

export default class LocaleQualityList extends AbstractQualityList {
  /**
   * Check if the value is accepted by the class implementation.
   *
   * @param value A value to add in the quality list.
   *
   * @returns True if the value is accepted, otherwise false.
   */
  protected valueIsAccepted(value: string): boolean {
    return /^[a-z]{2}-[A-Z]{2}$/.test(value);
  }
}
