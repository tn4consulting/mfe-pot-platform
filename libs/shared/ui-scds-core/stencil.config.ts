import { Config } from '@stencil/core';

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
  ],
  testing: {
    browserHeadless: 'new',
  },
};
