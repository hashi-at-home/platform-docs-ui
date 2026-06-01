// Modern ESLint flat config (ESLint 9+) for IDE support and future tooling.
// This mirrors the rules defined in .eslintrc.json for gulp-eslint@6/pre-commit.
// Both configs are synchronized to ensure consistent linting across tools.

import { defineConfig } from "eslint/config";
import js from "@eslint/js";

export default defineConfig([
  {
    ignores: ["node_modules/**", "dist/**", "build/**"],
  },
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        browser: true,
        node: true,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "arrow-parens": ["error", "always"],
      "comma-dangle": ["error", {
        arrays: "always-multiline",
        objects: "always-multiline",
        imports: "always-multiline",
        exports: "always-multiline",
      }],
      "no-restricted-properties": ["error", {
        property: "substr",
        message: "Use String#slice instead.",
      }],
      "max-len": [1, 120, 2],
      "spaced-comment": "off",
      "radix": ["error", "always"],
    },
  },
  {
    files: ["gulpfile.js", "gulp.d/**/*.js", "src/helpers/**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        require: "readonly",
        module: "readonly",
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "arrow-parens": ["error", "always"],
      "comma-dangle": ["error", {
        arrays: "always-multiline",
        objects: "always-multiline",
        imports: "always-multiline",
        exports: "always-multiline",
      }],
      "no-restricted-properties": ["error", {
        property: "substr",
        message: "Use String#slice instead.",
      }],
      "max-len": [1, 120, 2],
      "spaced-comment": "off",
      "radix": ["error", "always"],
    },
  },
  {
    files: ["src/js/**/*.js", "preview-src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "arrow-parens": ["error", "always"],
      "comma-dangle": ["error", {
        arrays: "always-multiline",
        objects: "always-multiline",
        imports: "always-multiline",
        exports: "always-multiline",
      }],
      "no-restricted-properties": ["error", {
        property: "substr",
        message: "Use String#slice instead.",
      }],
      "max-len": [1, 120, 2],
      "spaced-comment": "off",
      "radix": ["error", "always"],
    },
  },
]);
