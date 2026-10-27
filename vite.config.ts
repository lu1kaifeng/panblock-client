import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import compileTime from 'vite-plugin-compile-time'

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(),compileTime()],
  resolve: {
    tsconfigPaths: true,
  }
});
