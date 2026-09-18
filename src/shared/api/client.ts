import type { AxiosError } from 'axios';

import axios from 'axios';

import type { ApiErrorBody } from '@shared/types/api';

import { env } from '@shared/config/env';

export class ApiError extends Error {
    readonly code: string;
    readonly status: number;

    constructor(code: string, message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.status = status;
    }
}

export const apiClient = axios.create({
    baseURL: env.apiBaseUrl,
    timeout: 10_000,
    withCredentials: true,
});

// FE-BE 에러 코드 체계가 확정되면(기획서 '프론트엔드 연동 계약') 이 인터셉터에 공통 매핑을 추가한다
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
                ),
            );
        }
        return Promise.reject(error);
    },
);
