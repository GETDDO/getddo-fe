# 관리자 추첨 관리 화면 (GD-125) Implementation Plan

**Goal:** `/admin/draw`에 이벤트별 추첨 실행 목록·상세, 후보 명단, 정합성 검증 이력, 당첨 취소, 재추첨 시작·재개, 공개 명단 반영, 변경 이력(AD01~AD09)을 구현하고 MSW 목업으로 응모→추첨→당첨 취소→재추첨→변경 이력 시연 루프를 끝까지 돌린다.

**Status (2026-10-08):** 구현 완료. 검증 4종 통과, 브라우저(MSW)에서 시연 루프 확인.

**Spec:** `../getddo-spec/05-api/drawing.md`(AD01~AD09, 검토 대기), `02-domain/drawing.md`, `03-decisions/001·004·009·013`, `00-requirements/pending-decisions.md` "추첨과 결과 발표"

## 구조

| 레이어                   | 내용                                                                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `entities/drawResult`    | DrawRun·DrawRunDetail·DrawCandidate·DrawVerification Zod, AD01~AD04·AD08 조회 훅·경로 상수, AD09 경로, 오류 문구 헬퍼, 상태 메타 |
| `entities/winner`        | AwardCancellationResult·PublicationUpdateResult·PublicListChange Zod, AD05·AD06 경로, AD07 조회 훅                               |
| `features/runDraw`       | AD04 검증 mutation, AD05 당첨 취소 mutation + 사유 다이얼로그(멱등키, 연타 차단)                                                 |
| `features/runRedraw`     | AD09 재추첨 시작·재개, AD06 공개 명단 반영 mutation + 사유 다이얼로그                                                            |
| `pages/admin/draw`       | 이벤트 선택 → 실행 목록(번호형 Pager) → 실행 상세·후보·검증, 변경 이력 탭, 정책 미확정 안내                                      |
| `mocks/handlers/draw.ts` | AD01~AD09, 이벤트별 추첨 상태 스토어, 비동기 재추첨 진행 시뮬레이션                                                              |

## 결정

- 표는 작은 표시용이라 `@tanstack/react-table` 없이 `shared/ui/table`을 쓴다(이벤트 상세의 경품 표와 같은 방식). 정렬·필터 기능이 필요해지면 AbuseCaseTable 패턴(v9 `useTable`)으로 옮긴다
- 폴링: 서버 선정 중(PREPARING/READY/RUNNING)인 실행이 있을 때만 `queryPresets.realtime` 주기(30초)로 갱신하고 완료되면 멈춘다. FAILED는 관리자 재개를 기다리므로 폴링하지 않는다. 시연 편의를 위해 "상태 새로고침"·"지금 확인" 버튼을 둔다
- 최초 추첨은 ADR-009에 따라 자동이며 수동 시작 API가 계약에 없다 — `runDraw`는 검증·당첨 취소를 맡고 "추첨 실행" 버튼은 만들지 않는다
- AD06 사용 가능 여부는 재추첨이 취소한 결과(`canceledDrawResultId`)의 `wasPublished`로 판정한다. 이벤트 상태(`REDRAWING`)만으로는 최초 공개 전/후를 구분할 수 없다
- 취소 다이얼로그의 멱등키는 (당첨 ID, 사유) 의도 단위로 보관해 재시도에는 같은 키, 사유가 바뀌면 새 키를 쓴다 (ADR-0005)
- 오류 문구는 `drawErrorMessage` 한 곳(4xx는 서버 문구, 그 밖은 기본 문구)에 모았다 — ADR-0008의 `getErrorMessage`가 들어오면 본문만 교체한다

## 정책 미확정 (임의 확정 금지)

`docs/CONTEXT.md` "백엔드 연동 전 임시 상태"의 GD-125 항목 참조.

## 검증

`npm run format:check && npm run lint && npm run test:ci && npm run build`
