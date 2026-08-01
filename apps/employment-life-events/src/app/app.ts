import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { EmploymentLifeEventsFeatureGuidedJourney } from 'employment-life-events-feature-guided-journey';
import { TranslocoPipe } from '@tn4consulting/shared-i18n';
import { CLAIM_EMPLOYMENT_LIFE_EVENTS, getStoredSession, hasClaim, onSessionChange } from '@tn4consulting/shared-auth';

@Component({
  imports: [EmploymentLifeEventsFeatureGuidedJourney, RouterModule, TranslocoPipe],
  selector: 'msca-le-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'employment-life-events';
  // Defense in depth: this app validates its own claim independently,
  // never assuming "the shell let me navigate here, so I'm authorized" --
  // see CLAUDE.md's "Security: defense in depth" section.
  protected readonly hasAccess = signal(
    hasClaim(getStoredSession(), CLAIM_EMPLOYMENT_LIFE_EVENTS),
  );

  constructor() {
    const unsubscribe = onSessionChange((session) =>
      this.hasAccess.set(hasClaim(session, CLAIM_EMPLOYMENT_LIFE_EVENTS)),
    );
    inject(DestroyRef).onDestroy(unsubscribe);
  }
}
