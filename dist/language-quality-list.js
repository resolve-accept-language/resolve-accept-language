"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const abstract_quality_list_1 = __importDefault(require("./abstract-quality-list"));
class LanguageQualityList extends abstract_quality_list_1.default {
    /**
     * Check if the value is accepted by the class implementation.
     *
     * @param value A value to add in the quality list.
     *
     * @returns True if the value is accepted, otherwise false.
     */
    valueIsAccepted(value) {
        return /^[a-z]{2}$/.test(value);
    }
    /**
     * Get the top result from the list.
     *
     * @param localeList The list of locale from which the top language can be selected.
     *
     * @returns The top result (result with the highest quality).
     */
    getTopFromLocaleList(localeList) {
        const topLanguage = this.getTop();
        for (const localeObject of localeList.objects) {
            if (localeObject.languageCode === topLanguage) {
                return localeObject.code;
            }
        }
    }
}
exports.default = LanguageQualityList;
