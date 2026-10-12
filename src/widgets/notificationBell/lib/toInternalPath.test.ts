import { describe, expect, it } from 'vitest';

import { toInternalPath } from './toInternalPath';

describe('toInternalPath', () => {
    it('내부 경로는 그대로 돌려준다', () => {
        expect(toInternalPath('/events/evt-001')).toBe('/events/evt-001');
    });

    it('null·외부 URL·프로토콜 상대 URL은 null이다', () => {
        expect(toInternalPath(null)).toBeNull();
        expect(toInternalPath('https://example.com')).toBeNull();
        expect(toInternalPath('//example.com/x')).toBeNull();
    });
});
