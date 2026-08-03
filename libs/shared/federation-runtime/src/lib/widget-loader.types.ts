import { EnvironmentProviders, Provider, Type } from '@angular/core';

/**
 * Shared shape for widget loaders added after `PaymentHistoryWidgetLoader`
 * (see that file) -- deliberately a separate, additive type rather than a
 * generalization of it, so adding a new widget never requires shell,
 * dashboard, and employment-life-events to move in lockstep on a breaking
 * change to a type they already all depend on.
 *
 * `kind` exists because a widget can be sourced from a React remote
 * (job-bank has no Angular installed at all) as well as an Angular one --
 * the mount mechanics genuinely differ (`ViewContainerRef.createComponent`
 * with an environment injector vs. the injected `REACT_MOUNTER`), so the
 * consuming component needs to know which one it got.
 */
export interface LoadedAngularWidget {
  kind: 'angular';
  component: Type<unknown>;
  providers: (Provider | EnvironmentProviders)[];
}

/**
 * `component` is typed `unknown`, not `React.ComponentType`, for the same
 * reason `REACT_MOUNTER`'s own doc gives: this package has no dependency on
 * `react` at all. A React widget has no host-provided providers/DI
 * equivalent (see job-bank's `App.tsx`), so there's no `providers` field
 * here the way there is for the angular kind.
 */
export interface LoadedReactWidget {
  kind: 'react';
  component: unknown;
}

export type LoadedWidget = LoadedAngularWidget | LoadedReactWidget;

export type WidgetLoader = () => Promise<LoadedWidget>;
