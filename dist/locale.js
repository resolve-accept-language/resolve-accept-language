"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Locale {
    /**
     * Locale constructor.
     *
     * @param code A BCP47 locale code using the `language`-`country` format.
     *
     * @throws Will throw an error if the locale format is invalid.
     */
    constructor(code) {
        if (!code.includes('-')) {
            throw new Error(`invalid BCP47 locale '${code}'`);
        }
        const [languageCode, countryCode] = code.split('-');
        if (!/^[a-z]{2}$/i.test(languageCode)) {
            throw new Error(`invalid ISO 639-1 alpha-2 language code '${languageCode}' in ${code}`);
        }
        if (!/^[a-z]{2}$/i.test(countryCode)) {
            throw new Error(`invalid ISO 3166-1 alpha-2 country code '${countryCode}' in ${code}`);
        }
        this.languageCode = languageCode.toLowerCase();
        this.countryCode = countryCode.toUpperCase();
        this.code = `${this.languageCode}-${this.countryCode}`;
    }
}
exports.default = Locale;
