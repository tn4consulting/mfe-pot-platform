import { __decorate } from "tslib";
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { I18N_ASSET_BASE_URL } from './i18n-asset-base-url.token';
let MfeTranslocoHttpLoader = class MfeTranslocoHttpLoader {
    http = inject(HttpClient);
    assetBaseUrl = inject(I18N_ASSET_BASE_URL);
    getTranslation(lang) {
        return this.http.get(`${this.assetBaseUrl}assets/i18n/${lang}.json`);
    }
};
MfeTranslocoHttpLoader = __decorate([
    Injectable()
], MfeTranslocoHttpLoader);
export { MfeTranslocoHttpLoader };
//# sourceMappingURL=transloco-http-loader.js.map