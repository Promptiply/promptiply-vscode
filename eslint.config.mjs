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

      // Relax new strict rules to warnings to match old behavior
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-case-declarations': 'off',
      'prefer-const': 'off'
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
