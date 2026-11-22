import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    files: ["components/analysis/useAnalysisPreference.ts", "components/app/AppClient.tsx", "components/i18n/I18nProvider.tsx"],
    // shortcut: preserve existing state synchronization, revisit when refactoring these effects.
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "lib/generated/**", ".superpowers/**"]),
]);
