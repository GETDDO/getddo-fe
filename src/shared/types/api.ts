// 공통 API 응답/에러 스키마 — FE-BE 연동 계약(기획서 9.3절) 확정 시 이 파일에 맞춰 갱신한다

export interface ApiErrorBody {
    code: string;
    message: string;
}

export interface PageResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
}
