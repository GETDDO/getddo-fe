import { describe, expect, it } from 'vitest';

import { ApiError, parseRetryAfter } from './client';
import { DEFAULT_ERROR_MESSAGE, getErrorMessage } from './errorMessage';

describe('getErrorMessage', () => {
    it('매핑에 있는 코드는 서버 문구보다 FE 문구를 우선한다', () => {
        const error = new ApiError('INSUFFICIENT_TICKETS', '서버가 보낸 문구', 409);
        expect(getErrorMessage(error)).toBe('보유한 응모권이 부족합니다.');
    });

    it('매핑에 있으면 5xx여도 FE 문구를 쓴다', () => {
        const error = new ApiError('ACCESS_DENIED', '내부 예외 원문', 503);
        expect(getErrorMessage(error, '호출부 문구')).toBe('이 작업을 수행할 권한이 없습니다.');
    });

    it('매핑에 없는 업무 오류는 서버 문구를 쓴다', () => {
        const error = new ApiError('EVENT_NOT_FOUND', '이벤트를 찾을 수 없습니다', 404);
        expect(getErrorMessage(error, '호출부 문구')).toBe('이벤트를 찾을 수 없습니다');
    });

    it.each([
        ['5xx', new ApiError('SOME_CODE', '예외 원문', 500)],
        ['COMMON-001', new ApiError('COMMON-001', '내부 오류 원문', 400)],
        ['HTTP-* 코드', new ApiError('HTTP-405', 'Method Not Allowed', 405)],
    ])('%s는 서버 문구를 건너뛰고 fallback을 쓴다', (_, error) => {
        expect(getErrorMessage(error, '호출부 문구')).toBe('호출부 문구');
        expect(getErrorMessage(error)).toBe(DEFAULT_ERROR_MESSAGE);
    });

    it('ApiError가 아니면 fallback, 없으면 공통 기본 문구를 쓴다', () => {
        expect(getErrorMessage(new Error('Network Error'), '호출부 문구')).toBe('호출부 문구');
        expect(getErrorMessage('문자열')).toBe(DEFAULT_ERROR_MESSAGE);
    });

    it('429는 Retry-After가 있으면 대기 시간을 표시한다', () => {
        const seconds = new ApiError('RATE_LIMIT_EXCEEDED', '서버 문구', 429, 30);
        expect(getErrorMessage(seconds)).toContain('30초 후');

        const minutes = new ApiError('RATE_LIMIT_EXCEEDED', '서버 문구', 429, 90);
        expect(getErrorMessage(minutes)).toContain('2분 후');
    });

    it('__proto__ 같은 상속 키는 매핑으로 취급하지 않는다', () => {
        const error = new ApiError('__proto__', '서버 문구', 400);
        expect(getErrorMessage(error)).toBe('서버 문구');
    });

    it('429에 Retry-After가 없으면 일반 매핑 문구를 쓴다', () => {
        const error = new ApiError('RATE_LIMIT_EXCEEDED', '서버 문구', 429);
        expect(getErrorMessage(error)).toBe('요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.');
    });
});

describe('parseRetryAfter', () => {
    it('초 단위 정수를 그대로 돌려준다', () => {
        expect(parseRetryAfter('120')).toBe(120);
    });

    it('HTTP-date는 남은 초로 환산한다', () => {
        const now = Date.parse('2026-10-08T00:00:00Z');
        expect(parseRetryAfter('Thu, 08 Oct 2026 00:00:45 GMT', now)).toBe(45);
    });

    it('유한하지 않은 값은 undefined다', () => {
        expect(parseRetryAfter('9'.repeat(400))).toBeUndefined();
    });

    it('해석할 수 없는 값은 undefined다', () => {
        expect(parseRetryAfter(undefined)).toBeUndefined();
        expect(parseRetryAfter('abc')).toBeUndefined();
    });
});
