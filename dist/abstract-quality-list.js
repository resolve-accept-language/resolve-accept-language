"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AbstractQualityList {
    constructor() {
        /** Object to store quality data. */
        this.data = {};
    }
    /**
     * Check if the value is accepted by the class implementation (typically this should be overridden).
     *
     * @param value A value to add in the quality list.
     *
     * @returns True if the value is accepted, otherwise false.
     */
    valueIsAccepted(value) {
        return /^[\w]$/.test(value);
    }
    /**
     * Add a value in the data object matching its quality.
     *
     * @param quality The HTTP quality factor associated with a value.
     * @param value A string value coming from an HTTP header directive.
     */
    add(quality, value) {
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
    isEmpty() {
        return !Object.entries(this.data).length;
    }
    /**
     * Get the top result from the list.
     *
     * @returns The top result (result with the highest quality).
     */
    getTop() {
        return Object.entries(this.data).sort().reverse()[0][1][0];
    }
}
exports.default = AbstractQualityList;
