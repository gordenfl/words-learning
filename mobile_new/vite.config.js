import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { readFileSync } from "fs";
import { execSync } from "child_process";

function getBuildNumber() {
  try {
    return execSync("git rev-list --count HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "0";
  }
}

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_BUILD__: JSON.stringify(getBuildNumber()),
  },
  plugins: [vue()],
  base: "./", // required for Capacitor (file:// loading)
  server: {
    host: "0.0.0.0",
    port: 3000,
    cors: true,
  },
});
