import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import boundaries from 'eslint-plugin-boundaries'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules', '.agents']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      boundaries,
    },
    settings: {
      'import/resolver': {
        alias: {
          map: [
            ['@/app', './app'],
            ['@/features', './features'],
            ['@/shared', './shared'],
          ],
          extensions: ['.js', '.jsx', '.json'],
        },
      },
      'boundaries/elements': [
        {
          type: 'app',
          pattern: 'app/**/*',
        },
        {
          type: 'feature',
          pattern: 'features/*/**/*',
          capture: ['featureName'],
        },
        {
          type: 'shared',
          pattern: 'shared/**/*',
        },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              from: { type: 'shared' },
              allow: [
                { to: { type: 'shared' } }
              ],
            },
            {
              from: { type: 'feature', captured: { featureName: 'admin' } },
              allow: [
                { to: { type: 'shared' } },
                { to: { type: 'feature' } }
              ],
            },
            {
              from: { type: 'feature' },
              allow: [
                { to: { type: 'shared' } },
                { to: { type: 'feature', captured: { featureName: '{{from.captured.featureName}}' } } }
              ],
            },
            {
              from: { type: 'app' },
              allow: [
                { to: { type: 'shared' } },
                { to: { type: 'feature' } }
              ],
            },
          ],
        },
      ],
    },
  },
])
