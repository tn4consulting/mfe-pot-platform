import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // Tightened ahead of the per-app repo split (see CLAUDE.md's
            // "Monorepo -> future split" section): each app repo will only
            // have its own scope's libs plus the published shared-*
            // packages available, so an in-repo import that would become
            // impossible to resolve after the split needs to fail lint
            // *now*, while it's a one-PR fix instead of a cross-repo
            // rewrite. This replaced a wide-open `sourceTag: '*'` ->
            // `onlyDependOnLibsWithTags: ['*']` constraint that didn't
            // actually restrict anything -- it's why a real violation
            // (apps/shell importing an employment-life-events-scoped lib)
            // went uncaught until the split forced the issue.
            { sourceTag: 'type:e2e', onlyDependOnLibsWithTags: ['*'] },
            { sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared'] },
            {
              sourceTag: 'scope:employment-life-events',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:employment-life-events'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
