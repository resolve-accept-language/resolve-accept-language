/** An object where the keys are quality values (in string format) and their value an array of strings. */
type DataObject = Record<string, string[]>;

export default abstract class AbstractQualityList {
  /** Object to store quality data. */
  protected data: DataObject = {};

  /**
   * Check if the value is accepted by the class implementation (typically this should be overridden).
   *
   * @param value A value to add in the quality list.
   *
   * @returns True if the value is accepted, otherwise false.
   */
  protected valueIsAccepted(value: string): boolean {
    return /^[\w]$/.test(value);
  }

  /**
   * Add a value in the data object matching its quality.
   *
   * @param quality The HTTP quality factor associated with a value.
   * @param value A string value coming from an HTTP header directive.
   */
  public add(quality: string, value: string): void {
    if (!this.valueIsAccepted(value)) {
      throw new Error(`incorrect value '${value}'`);
    }
    if (!Array.isArray(this.data[quality])) {
      this.data[quality] = [];
    }
    this.data[quality].push(value);
  }

  /**
   * Check if the list is empty.
   *
   * @returns True if the list is empty, otherwise false.
   */
  public isEmpty(): boolean {
    return !Object.entries(this.data).length;
  }

  /**
   * Get the top result from the list.
   *
   * @returns The top result (result with the highest quality).
   */
  public getTop(): string {
    return Object.entries(this.data).sort().reverse()[0][1][0];
  }
}
