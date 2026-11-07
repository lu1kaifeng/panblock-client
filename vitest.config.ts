import { defineConfig } from 'vitest/config'
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        // 1. Prevents Vitest from persisting transformed code on disk (fixes line mismatch)
        fsModuleCache: false,
        hookTimeout:0,
        testTimeout:0,
        // 2. Disables the test result ordering cache (optional, ensures clean states)
        cache: false,
    },
})
