import type { Observable } from 'rxjs';
import type { Translation, TranslocoLoader } from '@jsverse/transloco';
export declare class MfeTranslocoHttpLoader implements TranslocoLoader {
    private readonly http;
    private readonly assetBaseUrl;
    getTranslation(lang: string): Observable<Translation>;
}
//# sourceMappingURL=transloco-http-loader.d.ts.map