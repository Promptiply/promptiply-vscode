import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Original rules from .eslintrc.json
      '@typescript-eslint/naming-convention': 'warn',
      'curly': 'warn',
      'eqeqeq': 'warn',
      'no-throw-literal': 'warn',

      // Gradually tighten rules - warn now, enforce later
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'warn',
      'no-case-declarations': 'warn',
      'prefer-const': 'warn'
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 6,
        sourceType: 'module'
      }
    }
  },
  {
    ignores: ['out/**', 'dist/**', '**/*.d.ts']
  }
);
