"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const locale_1 = __importDefault(require("./locale"));
class LocaleList {
    /**
     * LocaleList constructor.
     *
     * @param locales An array of BCP47 locale code using the `language`-`country` format.
     *
     * @throws Will throw an error if one of the locales format is invalid.
     */
    constructor(locales) {
        /** A list of locale objects. */
        this.objects = [];
        /** A list of BCP47 locale codes using the `language`-`country` format. */
        this.locales = [];
        /** A list of ISO 639-1 alpha-2 language codes. */
        this.languages = [];
        /** A list of ISO 3166-1 alpha-2 country codes. */
        this.counties = [];
        for (const locale of locales) {
            const localeObject = new locale_1.default(locale);
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
exports.default = LocaleList;
