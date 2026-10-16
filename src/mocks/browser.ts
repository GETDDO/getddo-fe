import { setupWorker } from 'msw/browser';

import { env } from '@shared/config/env';

import { handlers, hybridHandlers } from './handlers';

// 개발은 전체 목업, 배포는 실서버에 없는 도메인만 목업(하이브리드)으로 가로챈다
export const worker = setupWorker(...(env.isDev ? handlers : hybridHandlers));
