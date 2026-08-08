import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

// The React-aware ESLint layer every mfe-pot frontend app was independently
// declaring identically (see e.g. mfe-pot-dashboard-mfe's
// apps/dashboard-mfe/eslint.config.mjs before this existed) -- a faithful
// extraction, not a new ruleset. Spread this into an app's own
// eslint.config.mjs array, after that repo's own base/module-boundary
// config (module boundaries stay repo-local -- each repo's depConstraints
// are genuinely repo-specific, not shareable).
export default [
  {
    files: ['**/*.tsx', '**/*.jsx'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
    languageOptions: {
      ...react.configs.recommended.languageOptions,
    },
    settings: {
      react: { version: 'detect' },
    },
  },
];
