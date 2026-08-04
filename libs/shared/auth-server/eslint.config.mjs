import baseConfig from '../../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      // `declare global { namespace Express { interface Request {...} } }`
      // is TypeScript's only mechanism for augmenting a third-party
      // module's ambient types (verify-bearer-token.ts's Express.Request
      // augmentation) -- not a real runtime namespace the base rule is
      // meant to discourage. `allowDeclarations` narrows the rule to still
      // flag any actual runtime `namespace` usage.
      '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
    },
  },
];
