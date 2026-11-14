import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "vitest/config";
import { getTestTargets } from "./test/integration/targets";
config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });
getTestTargets(); // Fail clearly before starting/skipping any test when not configured.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "."), "server-only": path.resolve(__dirname, "test/helpers/server-only.ts") } },
  test: {
    include: ["test/integration/**/*.test.ts"], environment: "node",
    globalSetup: ["./test/integration/setup.ts"],
    fileParallelism: false, testTimeout: 30000, hookTimeout: 60000,
  },
});
