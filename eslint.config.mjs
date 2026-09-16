import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import prettierConfig from "eslint-config-prettier/flat";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/lib/**",
      "**/esm/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // The public API deliberately accepts `any` in a few react-admin-shaped places.
      "@typescript-eslint/no-explicit-any": "off",
      // react-admin render props hand components arguments they often ignore; unused
      // variables still matter.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { args: "none", varsIgnorePattern: "^_" },
      ],
    },
  },
  prettierConfig
);
