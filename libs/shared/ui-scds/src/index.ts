export * from './lib/stencil-generated/components';
// Subpath import, not the bare package specifier: Nx's buildable-libraries
// support substitutes a local-source path mapping for the bare specifier
// (since shared-ui-scds-core is itself an Nx project), which resolves to a
// directory with no co-located .d.ts and breaks the build. The generated
// stencil-generated/components.ts already sidesteps this the same way.
export type { ScdsCardTone, ScdsListColumn } from '@tn4consulting/shared-ui-scds-core/dist/components';
export { GcdsComponentsModule } from '@gcds-core/components-angular';
