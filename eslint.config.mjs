// eslint-config-next 16 ships flat configs, so they are spread in directly.
// Wrapping them in FlatCompat (the Next 15 setup) crashed ESLint on every file.
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [...coreWebVitals, ...typescript];

export default eslintConfig;
