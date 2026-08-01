import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type { Translation, TranslocoLoader } from '@jsverse/transloco';
import { I18N_ASSET_BASE_URL } from './i18n-asset-base-url.token';

@Injectable()
export class MfeTranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);
  private readonly assetBaseUrl = inject(I18N_ASSET_BASE_URL);

  getTranslation(lang: string): Observable<Translation> {
    return this.http.get<Translation>(`${this.assetBaseUrl}assets/i18n/${lang}.json`);
  }
}
