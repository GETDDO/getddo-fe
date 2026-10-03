import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from './server';

// vitest의 setupFiles로 등록 — MSW 목 서버 수명주기를 테스트와 묶는다
// (shared/test/setup.ts는 jest-dom·cleanup만 담당해 shared→mocks 상향 참조를 피한다)
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
