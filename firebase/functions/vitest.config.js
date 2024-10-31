import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      reporter: ["lcov", "text-summary"],
    },
    include: ["src/**/*.spec.ts"],
  },
});
