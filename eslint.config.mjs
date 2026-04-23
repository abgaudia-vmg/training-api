import stylistic from "@stylistic/eslint-plugin";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import globals from "globals";

// ========================================
// ESLINT CONFIGURATION
// ========================================

const config = [
    // ========================================
    // IGNORE PATTERNS
    // ========================================

    {
        ignores: [
            "dist/",
            "node_modules/",
            "coverage/",
        ],
    },

    // ========================================
    // MAIN CONFIGURATION BLOCK
    // ========================================

    {
        files: ["**/*.ts"],

        // ========================================
        // PLUGINS CONFIGURATION
        // ========================================

        plugins: {
            "@typescript-eslint": typescriptPlugin,
            "@stylistic": stylistic,
            "import": importPlugin,
        },

        // ========================================
        // LANGUAGE OPTIONS
        // ========================================

        languageOptions: {
            parser: typescriptParser,

            parserOptions: {
                ecmaVersion: 2022,
                sourceType: "module",
                project: "./tsconfig.json",
            },

            globals: {
                ...globals.node,
                ...globals.es2021,
            },
        },

        // ========================================
        // PLUGIN SETTINGS
        // ========================================

        settings: {
            "import/parsers": {
                "@typescript-eslint/parser": [".ts"],
            },

            "import/resolver": {
                typescript: {
                    project: ["tsconfig.json"],
                    extensions: [".ts"],
                    alwaysTryTypes: true,
                },

                node: {
                    project: ["tsconfig.json"],
                    extensions: [".js", ".ts"],
                },
            },

            "import/external-module-folders": ["node_modules"],
        },

        // ========================================
        // LINTING RULES CONFIGURATION
        // ========================================

        rules: {
            // ========================================
            // DEBUGGING / DEVELOPMENT
            // ========================================

            "no-console": ["warn", { allow: ["warn", "error"] }],

            // ========================================
            // CODE CORRECTNESS
            // ========================================

            "eqeqeq": ["error", "always"],
            "no-undef": "error",
            "no-shadow": "off",
            "no-param-reassign": "off",
            "prefer-destructuring": "off",
            "no-return-await": "error",
            "no-throw-literal": "error",
            "no-use-before-define": "off",
            "@typescript-eslint/no-use-before-define": ["error", { functions: false, classes: true, variables: true }],

            // ========================================
            // VARIABLES
            // ========================================

            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    vars: "all",
                    varsIgnorePattern: "^_",
                    args: "after-used",
                    argsIgnorePattern: "^_",
                },
            ],

            // ========================================
            // TYPESCRIPT
            // ========================================

            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-non-null-assertion": "warn",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/ban-ts-comment": "off",
            "@typescript-eslint/consistent-type-imports": ["warn", { prefer: "type-imports" }],
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/await-thenable": "error",
            "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: false }],
            "@typescript-eslint/require-await": "warn",

            // ========================================
            // STYLISTIC
            // ========================================

            // ESLint-as-formatter only applies rules with fixers; without indent,
            // class bodies / decorators are never normalized on save.
            "@stylistic/indent": [
                "error",
                4,
                {
                    SwitchCase: 1,
                },
            ],

            "@stylistic/no-trailing-spaces": "error",
            // max: Maximum number of consecutive empty lines allowed.
            // maxBOF: Maximum number of empty lines allowed at the beginning (BOF: Beginning Of File).
            // maxEOF: Maximum number of empty lines allowed at the end (EOF: End Of File).
            "@stylistic/no-multiple-empty-lines": [
                "error",
                {
                    max: 1,
                    maxBOF: 0, // no empty lines at the beginning of the file
                    maxEOF: 1, // at most one empty line at the end of the file
                },
            ],

            "quotes": ["error", "single"],
            "semi": ["error", "always"],

            // ========================================
            // IMPORT/EXPORT
            // ========================================

            "import/no-unresolved": "off",
            "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
            "import/order": [
                "warn",
                {
                    groups: [["external", "builtin"], "internal", ["parent", "sibling", "index"]],
                    pathGroups: [
                        { pattern: "**/config/**", group: "internal", position: "before" },
                        { pattern: "**/constants/**", group: "internal", position: "before" },
                        { pattern: "**/controllers/**", group: "internal", position: "before" },
                        { pattern: "**/middleware/**", group: "internal", position: "before" },
                        { pattern: "**/models/**", group: "internal", position: "before" },
                        { pattern: "**/repositories/**", group: "internal", position: "before" },
                        { pattern: "**/routes/**", group: "internal", position: "before" },
                        { pattern: "**/services/**", group: "internal", position: "before" },
                        { pattern: "**/types/**", group: "internal", position: "before" },
                        { pattern: "**/*.types.ts", group: "internal", position: "before" },
                        { pattern: "**/utils/**", group: "internal", position: "before" },
                        { pattern: "./**", group: "internal", position: "before" },
                        { pattern: "../**", group: "internal", position: "before" },
                    ],
                    pathGroupsExcludedImportTypes: ["builtin"],
                    "newlines-between": "never",
                    alphabetize: { order: "asc", caseInsensitive: true },
                },
            ],
        },
    },
];

// ========================================
// EXPORT CONFIGURATION
// ========================================

export default config;
