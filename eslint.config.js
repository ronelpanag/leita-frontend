// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const boundaries = require('eslint-plugin-boundaries');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    // Architectural boundaries: features are isolated from one another;
    // only core/ and shared/ may be imported across feature boundaries,
    // and core/shared must never depend on a feature.
    files: ['src/**/*.ts'],
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        typescript: { project: ['tsconfig.app.json', 'tsconfig.spec.json'] },
      },
      'boundaries/elements': [
        { type: 'core', pattern: 'src/app/core' },
        { type: 'shared', pattern: 'src/app/shared' },
        { type: 'feature', pattern: 'src/app/features/*', capture: ['featureName'] },
      ],
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'allow',
          rules: [
            {
              from: [{ element: { type: 'feature' } }],
              disallow: [
                {
                  element: {
                    type: 'feature',
                    captured: { featureName: '!{{from.captured.featureName}}' },
                  },
                },
              ],
              message:
                "Feature '{{from.captured.featureName}}' must not import from feature '{{to.captured.featureName}}'. Share code through core/ or shared/ instead.",
            },
            {
              from: [{ element: { type: 'core' } }, { element: { type: 'shared' } }],
              disallow: [{ element: { type: 'feature' } }],
              message: 'core/ and shared/ must not depend on feature code.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
