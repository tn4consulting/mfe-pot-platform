import { Config } from '@stencil/core';
import { angularOutputTarget } from '@stencil/angular-output-target';

export const config: Config = {
  namespace: 'scds',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
    },
    angularOutputTarget({
      componentCorePackage: '@tn4consulting/shared-ui-scds-core',
      outputType: 'standalone',
      customElementsDir: 'dist/components',
      directivesProxyFile: '../ui-scds/src/lib/stencil-generated/components.ts',
      directivesArrayFile: '../ui-scds/src/lib/stencil-generated/index.ts',
    }),
  ],
  testing: {
    browserHeadless: 'new',
  },
};
