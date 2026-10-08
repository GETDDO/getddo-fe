import { ApiError } from './client';

/** 오류 문구를 정할 수 없을 때(네트워크·타임아웃·봉투 없는 응답 등) 쓰는 공통 기본 문구 */
export const DEFAULT_ERROR_MESSAGE = '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';

/**
 * FE 매핑 테이블 (ADR-0008 1단계) — 오류 코드 체계(getddo-spec 05-api/common.md)가 확정되면 행만 추가한다.
 * 값은 코드→문구 데이터일 뿐이고, 화면별 분기는 문구가 아니라 `error.code`로 판단한다.
 */
const ERROR_MESSAGES: Record<string, string> = {
    INSUFFICIENT_TICKETS: '보유한 응모권이 부족합니다.',
    TICKET_LIMIT_EXCEEDED: '이 이벤트의 응모 한도를 초과했습니다.',
    ALREADY_ENTERED: '이미 응모한 이벤트입니다.',
    EVENT_NOT_OPEN: '지금은 응모할 수 있는 시간이 아닙니다.',
    MISSION_NOT_OPEN: '지금은 참여할 수 있는 미션이 아닙니다.',
    ENTRY_MEMBERSHIP_NOT_MET: '응모 가능한 멤버십 등급이 아닙니다.',
    RATE_LIMIT_EXCEEDED: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
    IDEMPOTENCY_CONFLICT:
        '이미 처리 중인 요청과 내용이 다릅니다. 화면을 새로고침한 뒤 다시 시도해 주세요.',
    USER_CONTEXT_REQUIRED: '사용자 정보를 확인할 수 없습니다. 다시 로그인해 주세요.',
    USER_CONTEXT_INVALID: '사용자 정보가 올바르지 않습니다. 다시 로그인해 주세요.',
    ACCESS_DENIED: '이 작업을 수행할 권한이 없습니다.',
};

/** 공개 문구 계약(common.md "오류")이 적용되지 않는 응답 — 서버 message를 화면에 노출하지 않는다 */
function isServerMessageUntrusted(error: ApiError): boolean {
    return error.status >= 500 || error.code === 'COMMON-001' || error.code.startsWith('HTTP-');
}

function formatWait(seconds: number): string {
    if (seconds < 60) return `${seconds}초`;
    return `${Math.ceil(seconds / 60)}분`;
}

/**
 * 화면에 보일 오류 문구를 ADR-0008 순서로 정한다.
 * 1) FE 매핑(5xx여도 우선) → 2) 서버 message(공개 계약이 적용되는 응답만) → 3) fallback/공통 기본 문구
 */
export function getErrorMessage(error: unknown, fallback: string = DEFAULT_ERROR_MESSAGE): string {
    if (!(error instanceof ApiError)) return fallback;

    // __proto__ 같은 상속 키가 매핑으로 잡히지 않도록 자체 속성만 본다
    const mapped = Object.hasOwn(ERROR_MESSAGES, error.code)
        ? ERROR_MESSAGES[error.code]
        : undefined;
    if (mapped) {
        if (error.code === 'RATE_LIMIT_EXCEEDED' && error.retryAfterSeconds != null) {
            return `요청이 너무 많습니다. ${formatWait(error.retryAfterSeconds)} 후에 다시 시도해 주세요.`;
        }
        return mapped;
    }

    if (isServerMessageUntrusted(error) || !error.message) return fallback;
    return error.message;
}
