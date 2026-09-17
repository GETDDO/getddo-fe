// 응모·추첨처럼 중복 제출이 위험한 요청에 붙이는 멱등키를 생성한다.
// 헤더 이름·전달 방식은 FE-BE 연동 계약 확정 후 공통 상수로 옮긴다.
export function createIdempotencyKey(): string {
    return crypto.randomUUID();
}
