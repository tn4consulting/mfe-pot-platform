import type { ComponentType } from 'react';

/**
 * Every widget-loader context in this package resolves to this same shape.
 * A React remote is fully self-configuring -- it fetches its own runtime
 * config and builds its own API client internally, rather than receiving
 * providers from the host -- see job-bank's own `App.tsx` for why. There's
 * nothing but the component itself to hand down; whatever cross-cutting
 * data a widget needs beyond that arrives as a plain prop, not a supplied
 * provider tree.
 */
export interface LoadedWidget {
  component: ComponentType<Record<string, unknown>>;
}

export type WidgetLoader = () => Promise<LoadedWidget>;
