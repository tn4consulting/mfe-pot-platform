// Deliberately type-only exports. Every scds-* component is consumed as a
// custom element (JSX tag / DOM API), registered via
// `@tn4consulting/shared-ui-scds-core/loader`'s `defineCustomElements()`,
// never by importing a component class from this package's main entry --
// confirmed by grep across every consumer in the family. Re-exporting all
// 18 component classes from here (the previous shape, when this package
// had only 2 components) tripped a real Stencil/Rollup bundler bug once
// the component count grew: `dist/esm/index.js`'s generated re-export for
// a Rollup-merged chunk (scds-badge + scds-text, which Rollup named
// `scds-badge_2.entry.js` after a naming collision) didn't match Stencil's
// own computed filename (`scds-badge.scds-text.entry.js`), breaking
// `Could not resolve` at bundle time for every consumer's federation
// build. Exporting only types sidesteps it entirely -- they're erased at
// compile time, so there's no runtime re-export for the bundler to get
// wrong.
export type { ScdsListColumn } from './components/scds-multi-column-list/scds-multi-column-list';
export type { ScdsIconName } from './components/scds-icon/scds-icon-paths';
export type { ScdsBadgeTone } from './components/scds-badge/scds-badge-types';
