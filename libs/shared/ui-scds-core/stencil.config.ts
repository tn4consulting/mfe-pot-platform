import { Config } from '@stencil/core';

// No Angular output target -- the Angular wrapper this used to generate
// (shared-ui-scds) had zero consumers left once every app converted to
// React and was deleted; every app now consumes these custom elements
// directly (see shared-ui-scds-core's own README).
export const config: Config = {
  namespace: 'scds',
  globalStyle: 'src/global/tokens.css',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
    },
  ],
  testing: {
    browserHeadless: 'new',
  },
};
