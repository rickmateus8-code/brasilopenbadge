import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' },
        miniflare: {
          d1Databases: ["DB"],
          compatibilityDate: "2026-03-19",
          compatibilityFlags: ["nodejs_compat"],
        }
      },
    },
  },
});
