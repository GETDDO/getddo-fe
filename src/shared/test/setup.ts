import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom에는 ResizeObserver가 없다 — Radix(radio-group 등)가 크기를 재는 훅에서 쓰므로 스텁으로 둔다
if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
}

// MSW 수명주기는 src/mocks/testSetup.ts가 담당한다 — shared가 mocks를 참조하면
// FSD 의존 방향(하위→상위)을 거꾸로 타기 때문에 둘을 분리했다
afterEach(() => {
    cleanup();
});
