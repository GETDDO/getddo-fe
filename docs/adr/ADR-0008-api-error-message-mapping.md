# ADR-0008: API 오류 문구 결정 순서

- 상태: proposed
- 날짜: 2026-10-08

## 맥락

`shared/api/client.ts`는 실패 봉투(`{ success: false, code, message, data: null }`)를 `ApiError(code, message, status)`로 정규화한다. 그러나 화면에 보일 문구는 컴포넌트마다 `error instanceof ApiError ? error.message : '...'`로 따로 정한다. 이 방식은 다음 문제가 있다.

- 서버 메시지 톤·용어가 그대로 노출된다. 또 업무 오류가 아닌 응답(5xx, MVC 표준 예외)의 `message`는 공개용으로 정의된 문구가 아닌데도 화면에 그대로 나간다
- 같은 코드(`INSUFFICIENT_TICKETS` 등)가 화면마다 다른 문구로 보일 수 있다
- 오류 코드 체계(`../getddo-spec/05-api/common.md`)는 아직 제안 단계라 FE 매핑을 완성할 수 없다

## 결정

화면 문구는 아래 순서로 정한다. `shared/api/`에 `getErrorMessage(error, fallback?)` 하나를 두고 모든 화면이 이 함수를 쓴다.

1. **FE 매핑 테이블** — `code`가 매핑에 있으면 FE 문구를 쓴다. 초기 매핑은 spec 초안에 이미 나온 코드로 시작한다 (`INSUFFICIENT_TICKETS`, `TICKET_LIMIT_EXCEEDED`, `ALREADY_ENTERED`, `EVENT_NOT_OPEN`, `MISSION_NOT_OPEN`, `ENTRY_MEMBERSHIP_NOT_MET`, `RATE_LIMIT_EXCEEDED`, `IDEMPOTENCY_CONFLICT`, `USER_CONTEXT_REQUIRED`, `USER_CONTEXT_INVALID`, `ACCESS_DENIED`)
2. **서버 `message`** — 매핑에 없는 `ApiError`는 서버 문구를 쓴다. 단, 공개 문구 계약이 적용되는 응답에 한한다 (아래 "서버 문구 사용 조건")
3. **기본 문구** — `ApiError`가 아닌 오류(네트워크·타임아웃·봉투 없는 5xx)는 호출부 `fallback` 또는 공통 기본 문구를 쓴다

서버 문구 사용 조건:

- 근거 계약: spec 공통 계약(`../getddo-spec/05-api/common.md` "오류")은 업무 오류의 공개 메시지를 담당자가 정의하고, 탐지 수치·내부 어뷰징 근거·예외 원문을 사용자 오류에 넣지 않는다고 정한다. FE는 이 계약이 적용되는 응답의 `message`만 사용자 문구로 신뢰한다
- 계약이 적용되지 않는 응답은 2단계를 건너뛰고 기본 문구를 쓴다 — `5xx` 전체, `COMMON-001`, MVC 표준 예외 처리가 만드는 `HTTP-{상태}` 코드(공개용으로 정의된 문구가 아니다)
- 2단계를 건너뛰어도 순서는 같다: `code`가 FE 매핑에 있으면 5xx라도 FE 문구를 쓰고, 매핑에 없으면 서버 문구 대신 기본 문구를 쓴다. 기본 문구가 FE 매핑보다 앞서는 예외는 없다
- 공통 계약이 확정될 때 이 공개 문구 조항이 빠지거나 바뀌면, 2단계를 없애고 매핑에 없는 코드는 모두 기본 문구로 처리하도록 이 ADR을 갱신한다

추가 규칙:

- `429 RATE_LIMIT_EXCEEDED`는 `Retry-After`를 `ApiError`에 담아 문구에 대기 시간을 표시할 수 있게 한다
- 화면별 분기(예: 잔액 부족 시 전용 다이얼로그)는 문구가 아닌 `error.code`로 판단한다. 문구 문자열을 비교하지 않는다
- 매핑 테이블은 도메인을 모르는 `shared`에 두되, 값은 코드→문구 데이터일 뿐이다. 도메인별 화면 처리(다이얼로그 전환 등)는 각 feature에 둔다

## 결과

- 오류 코드가 확정되기 전에도 화면이 깨지지 않는다 — 모르는 업무 오류 코드는 서버 공개 문구, 그 밖의 오류는 기본 문구로 떨어진다
- 코드 체계가 확정되면 매핑 테이블에 행만 추가한다
- 후속 작업: `getErrorMessage` 추가, 기존 `error instanceof ApiError ? error.message` 4곳(`EventActionDialog`, `QuizForm`, `SurveyForm`, `AdminEventFormPage`) 교체, 인터셉터에서 `Retry-After` 보존
