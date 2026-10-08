import { ApiError } from '@shared/api/client';

/**
 * 배너 변경 실패 문구 — 서버가 준 업무 오류 메시지(최대 5개 초과, 목록 불일치 등)를 우선한다.
 * TODO: shared/api의 공통 getErrorMessage(GD-124)가 머지되면 이 함수를 그것으로 교체한다
 */
export function bannerErrorMessage(error: unknown, fallback: string): string {
    return error instanceof ApiError ? error.message : fallback;
}
