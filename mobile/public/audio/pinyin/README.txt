Pinyin final demo audio (optional)

1) In mobile/.env set:
   VITE_PINYIN_AUDIO_BASE_URL=/audio/pinyin
   (or a full URL like https://cdn.example.com/pinyin)

2) Add files under mobile/public/audio/pinyin/ so they are served as:
   /audio/pinyin/{stem}-{tone}.mp3
   where tone is 1, 2, 3, 4.

   stem = final as in the app route, except (see pinyinFinalAudioStem()):
   - ü     -> u-dia
   - üe    -> ue-dia
   - üan   -> uan-dia
   - ün    -> un-dia

   Examples:
   a-1.mp3 … a-4.mp3
   ai-1.mp3 …
   uan-1.mp3 …
   u-dia-1.mp3 …
   ue-dia-1.mp3 …
   uan-dia-1.mp3 …
   un-dia-1.mp3 …

3) Optional: VITE_PINYIN_AUDIO_EXT=wav

4) hanyu-pinyin-audio (GitHub mirror of gitcode syllable clips):
   - From mobile/: npm run pinyin:sync-hanyu
   - See ../pinyin-hanyu/README.txt — then set VITE_PINYIN_AUDIO_BASE_URL=/audio/pinyin-hanyu
     and VITE_PINYIN_AUDIO_NAMING=hanyu

5) Authorized bulk audio (e.g. licensed Dig Mandarin clips):
   - From mobile/: node scripts/generate-pinyin-audio-manifest.mjs
     -> scripts/manifest.to-fill.json lists every {stem}-{tone}.mp3 the app needs.
   - Replace each "url" with the direct MP3 link from your source (under your license).
   - node scripts/download-pinyin-audio.mjs scripts/manifest.to-fill.json
   - Set VITE_PINYIN_AUDIO_BASE_URL=/audio/pinyin in mobile/.env
   - Rebuild / cap sync. Empty "url" rows are skipped.
