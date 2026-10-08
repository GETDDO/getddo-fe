# ADR-0006: 응모 기록·감사 로그 슬라이스 경계

- 상태: proposed
- 날짜: 2026-10-08

## 맥락

기획 단계에서 "응모 내역(entry)", "참여 로그(participation-log)", "감사 로그" 세 개념이 혼용됐다. 감사 로그는 관리자 변경 기록(처리자·시각·변경 전후)이라 응모 기록과 성격이 다르지만, entry와 participation-log는 경계가 불분명해 슬라이스를 어떻게 나눌지 정해지지 않았다.

공용 API 초안(`../getddo-spec/05-api/entry.md`, `audit.md`)을 확인한 결과:

- 응모 기록은 `EntryReceipt` 하나로 표현된다. 접수(`ACCEPTED`)뿐 아니라 업무 거절(`REJECTED`, `rejectionCode`·`rejectionReason`)도 같은 모델로 E05/E06에서 조회한다 — "참여 시도 로그"가 별도 리소스로 존재하지 않는다
- 감사 로그는 AU01/AU02의 별도 리소스다 (`actorId`, `action`, `targetType`, `beforeData`/`afterData`)
- spec 어디에도 participation-log라는 리소스·용어가 없다

## 결정

- **participation-log 슬라이스를 만들지 않는다.** 응모 시도·접수·거절 이력은 모두 `entities/entry`가 소유한다 (`EntryReceipt` 기반)
- 관리자 응모 조회(AO06 `AdminEntry`)도 `entities/entry`에 둔다 — `EntryReceipt` 전체 + `userId`라 같은 모델의 확장이다
- 감사 로그는 `entities/audit`가 소유한다 (구현 완료). 응모 화면에서 감사 로그를 참조하지 않고, 감사 로그 화면은 `targetType`·`targetId`로 응모를 가리키기만 한다
- 응모 현황 집계(E03 `EntryStatistics`)도 응모 도메인이므로 `entities/entry`에 둔다 (ADR-0007)
- 오너: `entities/entry`는 응모 기능 담당, `entities/audit`는 관리자 신뢰성 담당이 유지한다

## 결과

- 개념이 2개(응모 기록, 감사 로그)로 줄어든다. "참여 로그"라는 표현은 문서·티켓에서 "응모 내역"으로 통일한다
- 백엔드가 이후 "응모 시도 로그"(형식 오류·인증 실패 포함)를 별도 리소스로 제공하기로 하면 이 ADR을 다시 연다 — 현재 초안은 해당 이력을 "제공하지 않는다"고 명시한다
