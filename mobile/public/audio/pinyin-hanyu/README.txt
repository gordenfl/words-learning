Audio files in this folder come from the open dataset mirrored in:
  https://github.com/zispace/hanyu-pinyin-audio/tree/data/gitcode.com/audio

Populate by running from mobile/:
  npm run pinyin:sync-hanyu

Optional: GITHUB_TOKEN in env for higher GitHub API limits.

After sync, in mobile/.env:
  VITE_PINYIN_AUDIO_BASE_URL=/audio/pinyin-hanyu
  VITE_PINYIN_AUDIO_NAMING=hanyu

Review the upstream repo LICENSE before shipping your app.
