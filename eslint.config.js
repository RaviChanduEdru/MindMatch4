import js from "@eslint/js";
import react from "eslint-plugin-react";
import globals from "globals";

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      ".understand-anything/**",
      "pr-review-36/**",
      "coverage/**",
    ],
  },
  js.configs.recommended,
  react.configs.flat.recommended,
  {
    // Pinned explicitly: eslint-plugin-react's "detect" path calls the
    // getFilename API removed in ESLint 10 and throws. Bump on React upgrades.
    settings: { react: { version: "19.2" } },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        // Analytics globals the app defines at runtime (ai/analytics.js).
        gtag: "readonly",
        dataLayer: "readonly",
        mm4log: "readonly",
      },
    },
    rules: {
      // This project does not use PropTypes; TypeScript-free small game hub.
      "react/prop-types": "off",
      // Empty catch blocks are intentional (best-effort localStorage writes).
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],
    },
  },
  {
    // Service worker runtime (self, caches, clients, …).
    files: ["sw.js"],
    languageOptions: { globals: { ...globals.serviceworker } },
  },
  {
    // Jest tests run under Node.
    files: ["tests/**", "**/*.test.js"],
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
  },
  {
    // Node-only tooling config files.
    files: ["vite.config.js", "eslint.config.js"],
    languageOptions: { globals: { ...globals.node } },
  },
];
