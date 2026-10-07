import { HttpResponse } from 'msw';

/*
 * getddo-spec 05-api/common.md의 공통 응답 봉투 — 모든 목업 응답이 이 형태를 따른다.
 * 성공은 { success:true, code, message, data }, 실패는 { success:false, code, message, data:null }다.
 */
// 멱등키 저장처럼 HttpResponse가 아니라 본문 자체가 필요한 곳을 위해 빌더도 연다
export const okBody = (data: unknown) => ({
    success: true,
    code: 'SUCCESS',
    message: '성공했습니다.',
    data,
});

export const failBody = (code: string, message: string) => ({
    success: false,
    code,
    message,
    data: null,
});

export const ok = (data: unknown, status = 200) => HttpResponse.json(okBody(data), { status });

export const fail = (status: number, code: string, message: string) =>
    HttpResponse.json(failBody(code, message), { status });
