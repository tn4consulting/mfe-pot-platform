import type { DetailedHTMLProps, HTMLAttributes } from 'react';

/**
 * Minimal JSX typing for the one SCDS custom element this package renders
 * directly (RemoteRouteHost's Suspense fallback). Augments `React.JSX`
 * directly, not a bare global `JSX` namespace -- this @types/react version
 * nests the namespace the classic `jsxFactory: 'React.createElement'`
 * transform actually resolves under `React.JSX`
 * (`declare namespace React { namespace JSX {...} } }` in
 * @types/react/index.d.ts, no bare global `JSX` bridge shipped alongside
 * it), confirmed empirically: this package's `tsc --build` (unlike every
 * app's esbuild-based build, which never runs a real project-wide
 * type-check) actually fails against a bare `declare global { namespace
 * JSX {...} } }` augmentation the same shape every app's own
 * scds-elements.d.ts uses -- that pattern creates an unrelated, never-
 * consulted global `JSX` namespace under this React version rather than
 * merging into the one actually checked.
 */
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'scds-spinner': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        label?: string;
        size?: 'small' | 'regular';
      };
    }
  }
}

export {};
