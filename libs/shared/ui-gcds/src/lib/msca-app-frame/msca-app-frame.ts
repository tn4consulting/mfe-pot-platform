import { Component, DestroyRef, Input, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GcdsComponentsModule } from '@gcds-core/components-angular';
import { broadcastLocaleChange, getStoredLocale, Locale, TranslocoPipe, TranslocoService } from '@tn4consulting/shared-i18n';
import { AuthSession, clearSession, getStoredSession, onSessionChange } from '@tn4consulting/shared-auth';

/**
 * The GC-standard app frame (header + footer), owned by the shell only.
 * Remotes render their own content inside it via the shell's router-outlet
 * -- they never render their own header/footer (see CLAUDE.md: the shell
 * owns the app frame; remotes are content only).
 */
@Component({
  selector: 'msca-app-frame',
  standalone: true,
  imports: [GcdsComponentsModule, TranslocoPipe],
  templateUrl: './msca-app-frame.html',
  styleUrl: './msca-app-frame.css',
})
export class MscaAppFrame {
  @Input() brandName = 'My Service Canada Account';

  private readonly transloco = inject(TranslocoService);
  private readonly router = inject(Router);

  protected activeLocale: Locale = getStoredLocale();
  protected readonly session = signal<AuthSession | null>(getStoredSession());

  constructor() {
    const unsubscribe = onSessionChange((session) => this.session.set(session));
    inject(DestroyRef).onDestroy(unsubscribe);
  }

  protected get otherLocale(): Locale {
    return this.activeLocale === 'en' ? 'fr' : 'en';
  }

  protected switchLocale(): void {
    const next = this.otherLocale;
    this.activeLocale = next;
    this.transloco.setActiveLang(next);
    broadcastLocaleChange(next);
  }

  protected signOut(): void {
    clearSession();
    this.router.navigateByUrl('/');
  }
}
