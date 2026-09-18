# ADR — 아키텍처 결정 기록

"왜 이렇게 했는가"를 남기는 문서다. 기존 결정을 바꾸는 작업을 하기 전에 해당 ADR을 먼저 읽는다.
새 결정을 내리면 번호를 이어붙인다 (`ADR-0006-*.md`). 상태값: `proposed` | `accepted` | `deprecated` | `superseded by ADR-XXXX`.

| 번호                                             | 결정                                          | 상태     |
| ------------------------------------------------ | --------------------------------------------- | -------- |
| [ADR-0001](./ADR-0001-fsd-architecture.md)       | FSD 레이어 아키텍처 채택                      | accepted |
| [ADR-0002](./ADR-0002-msw-mock-strategy.md)      | 백엔드 미준비 기간 MSW 목업 전략              | accepted |
| [ADR-0003](./ADR-0003-state-management-roles.md) | 상태관리 도구 4분할 (Query/Zustand/Redux/RHF) | accepted |
| [ADR-0004](./ADR-0004-utc-kst-virtual-clock.md)  | UTC 수신 + KST 표시 + 가상 시계               | accepted |
| [ADR-0005](./ADR-0005-idempotency-key.md)        | 중복 위험 요청에 멱등키 적용                  | accepted |
