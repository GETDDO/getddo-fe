import type { AxiosError } from 'axios';

import axios from 'axios';

import { env } from '@shared/config/env';

// 공통 API 에러 응답 — FE-BE 연동 계약(docs/product-context.md '프론트엔드 연동 계약') 확정 시 갱신한다
interface ApiErrorBody {
    code: string;
    message: string;
}

export class ApiError extends Error {
    readonly code: string;
    readonly status: number;
    /** 429 응답의 `Retry-After`를 초 단위로 환산한 값 — 헤더가 없거나 해석할 수 없으면 undefined */
    readonly retryAfterSeconds?: number;

    constructor(code: string, message: string, status: number, retryAfterSeconds?: number) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.status = status;
        this.retryAfterSeconds = retryAfterSeconds;
    }
}

/** `Retry-After`는 초 단위 정수 또는 HTTP-date다 (RFC 9110) — 둘 다 남은 초로 환산한다 */
export function parseRetryAfter(value: unknown, now = Date.now()): number | undefined {
    if (typeof value !== 'string' && typeof value !== 'number') return undefined;
    const raw = String(value).trim();
    if (raw === '') return undefined;
    if (/^\d+$/.test(raw)) {
        // 지나치게 긴 숫자 문자열은 Infinity가 되므로 유한한 값만 인정한다
        const seconds = Number(raw);
        return Number.isFinite(seconds) ? seconds : undefined;
    }
    const at = Date.parse(raw);
    if (Number.isNaN(at)) return undefined;
    return Math.max(0, Math.ceil((at - now) / 1000));
}

export const apiClient = axios.create({
    baseURL: env.apiBaseUrl,
    timeout: 10_000,
    withCredentials: true,
});

// FE-BE 에러 코드 체계가 확정되면(docs/product-context.md '프론트엔드 연동 계약') 이 인터셉터에 공통 매핑을 추가한다
apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorBody>) => {
        const body = error.response?.data;
        if (body?.code) {
            return Promise.reject(
                new ApiError(
                    body.code,
                    body.message ?? '요청 처리에 실패했습니다',
                    error.response?.status ?? 0,
                    parseRetryAfter(error.response?.headers?.['retry-after']),
                ),
            );
        }
        return Promise.reject(error);
    },
);
