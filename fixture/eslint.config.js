import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules/**', '.specify/**', '.claude/**', 'specs/**'] },
  ...tseslint.configs.recommended,
  { files: ['test/**/*.ts'], rules: { '@typescript-eslint/no-explicit-any': 'off' } },
);
