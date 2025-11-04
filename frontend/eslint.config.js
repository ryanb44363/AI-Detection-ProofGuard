import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Relax overly strict defaults to reduce friction while keeping useful checks
      '@typescript-eslint/no-explicit-any': 'off',
      // Allow intentional empty blocks (common with try/catch fallbacks)
      'no-empty': 'off',
      // Building HTML strings intentionally uses escapes
      'no-useless-escape': 'off',
      // In this project we manage hook deps manually to avoid churn in large handlers
      'react-hooks/exhaustive-deps': 'off',
      // Prefer but don't enforce const
      'prefer-const': 'warn',
    },
  },
])
