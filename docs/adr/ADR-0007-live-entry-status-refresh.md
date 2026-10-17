# ADR-0007: 실시간 응모 현황 갱신 방식

- 상태: accepted
- 날짜: 2026-10-08

## 맥락

실시간 응모 현황(기능 요구사항 7절)은 현재 이벤트 목록·상세 쿼리(`useEventList`, `useEvent`)가 `queryPresets.realtime`(30초 폴링)으로 이벤트 전체를 다시 받아 `participantCount`·`usedTicketCount`를 표시한다. 문제는 다음과 같다.

- 현황 수치를 위해 이벤트 목록 전체(모든 페이지)를 30초마다 다시 받는다
- `participantCount`·`usedTicketCount`는 spec의 `EventSummary`에 없는 필드다. spec은 현황을 E03 `GET /events/{eventId}/statistics`(`EntryStatistics`)로 분리했다
- spec이 요구하는 "본인 차감 수"(`mySpentTicketCount`)를 표시할 경로가 없다

spec의 E03 계약(`../getddo-spec/05-api/entry.md`)은 GD-200 현행 구현으로 지표를 기록한다. `participantCount`는 접수 완료 응모자의 중복 제거 수, `totalSpentTicketCount`는 그 응모자들의 누적 차감 합계(반환은 빼지 않음), `mySpentTicketCount`는 본인 누적 차감(미응모·관리자는 0)이며 거절 이력은 포함하지 않는다. 재조회 방식은 제안이며 SSE·WebSocket은 필수 계약이 아니다. 갱신 주기는 기능 요구사항 7절에서 구현 담당자에게 위임했으므로 FE는 폴링을 선택한다.

## 결정

- 현황은 **E03 전용 조회 훅** `useEntryStatistics(eventId)`로 받는다. `entities/entry/api/`에 두고 `ENTRIES_KEY` 하위 키(`[...ENTRIES_KEY, 'statistics', eventId]`)를 쓴다
- 폴링 정책:
    - 응모 진행 중(`open`) 이벤트만 `queryPresets.realtime`(30초) 폴링한다. 그 외 상태는 폴링하지 않는다
    - 백그라운드 탭에서는 폴링하지 않는다 (TanStack Query 기본값 `refetchIntervalInBackground: false` 유지)
    - 응모 성공 직후 `features/enterEvent`가 E03·E07·T01 쿼리를 무효화한다 (spec 제안과 동일)
- 위젯(`widgets/liveEntryStatus`)은 `event` 대신 `eventId`를 받아 훅을 직접 호출한다. 표시 항목은 응모자 수, 총 차감 응모권 수, 본인 차감 수이고 당첨 확률은 표시하지 않는다
- 이벤트 목록·상세 쿼리의 폴링은 현황이 아닌 **상태 전환 감지** 용도로만 남긴다 (예: `closed → drawn`). 현황 수치 표시는 이벤트 쿼리에서 읽지 않는다
- 백엔드가 SSE를 도입하면 `useEntryStatistics` 내부만 `setQueryData` 방식으로 교체한다 — 위젯·소비자 코드는 바뀌지 않는다

## 결과

- 현황 수치용 요청이 보이는 이벤트별 E03 1건으로 한정된다. 다만 이벤트 목록·상세 폴링(상태 전환 감지용, 전체 페이지 조회)은 계속되므로 전체 API 호출량이 줄어든다고 보지 않는다 — E03 요청이 추가되는 만큼 오히려 늘 수 있다. 홈 배너처럼 여러 이벤트를 동시에 보이는 화면은 현재 보이는 슬라이드만 `enabled`로 폴링한다
- 30초 주기는 서버 부하 확인 대상이다 — 백엔드가 다른 값을 요청하면 `queryPresets.realtime` 한 곳만 바꾼다
- 후속 작업(GD-124에서 처리): E03 MSW 핸들러 추가, `useEntryStatistics` 구현, `LiveEntryStatus`·`RaffleDetailHero`·`LiveRaffleCard`·`FeaturedEventCard` 전환, `eventSchema`의 임시 필드 제거
