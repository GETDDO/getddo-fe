import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config.ts';

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            environment: 'jsdom',
            setupFiles: ['./src/shared/test/setup.ts'],
            globals: true,
            css: true,
            // .env는 커밋하지 않아 CI에는 없다. 값이 비면 목 핸들러가 등록하는 경로와
            // API 클라이언트가 요청하는 경로가 어긋나 MSW가 가로채지 못한다.
            env: {
                VITE_API_BASE_URL: '/api',
                VITE_ENABLE_MSW: 'true',
            },
        },
    }),
);
