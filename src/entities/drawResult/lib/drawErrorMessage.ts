import { ApiError } from '@shared/api/client';

/**
 * 추첨·당첨 취소 오류 문구를 정하는 단일 지점.
 * ADR-0008의 getErrorMessage가 shared/api에 들어오면 이 함수 본문을 그 호출로 교체한다.
 * 화면 분기는 문구가 아니라 error.code로 판단한다.
 */
export function drawErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        return error.message;
    }
    return fallback;
}
