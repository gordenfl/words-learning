// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: "com.gordenfl.wordslearning",
  appName: "Chinese Words Learning",
  webDir: "dist",
  server: {
    cleartext: true,
    url: 'http://0.0.0.0:3000',
    cleartext : true
  }
};

export default config;
