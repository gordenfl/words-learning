// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="node" />
// TypeScript: ensure `process.env` is typed in this config file.
declare const process: { env: Record<string, string | undefined> };

// Use a dev server only when explicitly set for development builds.
// (kept runtime-safe: avoid requiring Node type declarations)
const devServerUrl = typeof process !== "undefined" ? process.env.CAP_SERVER_URL : undefined;

const config: CapacitorConfig = {
  appId: "com.gordenfl.wordslearning",
  appName: "Chinese Words Learning",
  webDir: "dist",
  ...(devServerUrl
    ? {
        server: {
          cleartext: true,
          url: devServerUrl,
        },
      }
    : {}),
};

export default config;
