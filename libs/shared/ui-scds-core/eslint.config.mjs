import baseConfig from '../../../eslint.config.mjs';

// No Angular-eslint plugins here (unlike other libs/shared/* configs) --
// this is a plain Stencil/TSX package, not an Angular one, and
// angular-eslint's rules (component/directive selector conventions etc.)
// don't apply to Stencil's own @Component/@Prop/@Event decorators.
export default [
  {
    // dist/ (build output) and loader/ (Stencil-generated loader, not
    // hand-written -- see stencil.config.ts's esmLoaderPath) aren't source.
    ignores: ['dist/**', 'loader/**', 'www/**'],
  },
  ...baseConfig,
  {
    files: ['**/*.tsx'],
    rules: {
      // `h` is Stencil's JSX pragma (stencil.config.ts / tsconfig.json's
      // jsxFactory) -- every .tsx file needs the import for JSX to compile,
      // but never references it by name directly, which no-unused-vars
      // can't tell apart from a genuinely-unused import.
      '@typescript-eslint/no-unused-vars': ['warn', { varsIgnorePattern: '^h$' }],
    },
  },
];
