import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,        // allow describe/test/expect without import
    environment: "node",  // Node environment
    include: ["backend/tests/**/*.ts"],
    silent: false,
    threads: true,
  },
});