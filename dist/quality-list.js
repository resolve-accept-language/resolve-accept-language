"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class QualityList {
    constructor() {
        /** Object to store quality data. */
        this.data = {};
    }
    add(quality, value) {
        if (!Array.isArray(this.data[quality])) {
            this.data[quality] = [];
        }
        this.data[quality].push(value);
    }
    isEmpty() {
        return !Object.entries(this.data).length;
    }
    getTop() {
        return Object.entries(this.data).sort().reverse()[0][1][0];
    }
    getTopFromLanguage(localeList) {
        const topLanguage = this.getTop();
        for (const localeObject of localeList.objects) {
            if (localeObject.languageCode === topLanguage) {
                return localeObject.code;
            }
        }
    }
}
exports.default = QualityList;
