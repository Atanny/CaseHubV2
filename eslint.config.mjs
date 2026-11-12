import nextVitals from 'eslint-config-next/core-web-vitals'

const config = [
  ...nextVitals,
  {
    ignores: ['.next/**', 'node_modules/**', 'supabase/**'],
  },
  {
    // Resolve the `@/` and `@server/` aliases from jsconfig.json for import rules.
    settings: {
      'import/resolver': {
        node: { extensions: ['.js', '.jsx'] },
      },
    },
    rules: {
      // React Compiler-era rules bundled with eslint-config-next 16. They flag long-standing
      // patterns in this codebase (components declared inside render, Date.now() during render,
      // setState inside effects). Kept visible as warnings; fix them gradually, not in a refactor
      // that must preserve behavior.
      'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/refs': 'warn',
      'no-undef': 'error',
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
    },
  },
]

export default config
