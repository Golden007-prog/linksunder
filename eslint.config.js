import js from '@eslint/js';
import ts from 'typescript-eslint';
export default ts.config(
  {
    ignores: [
      'dist/**',
      'build/**',
      'release/**',
      'node_modules/**',
      'data/**',
      'test-results/**',
      'playwright-report/**',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  { rules: { '@typescript-eslint/no-explicit-any': 'error' } },
  { files: ['scripts/*.mjs'], languageOptions: { globals: { fetch: 'readonly' } } },
  {
    files: ['desktop/**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { process: 'readonly' },
    },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
);
