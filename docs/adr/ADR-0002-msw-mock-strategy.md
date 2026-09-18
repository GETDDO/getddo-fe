# ADR-0002: 백엔드 미준비 기간 MSW 목업 전략

- 상태: accepted
- 날짜: 2026-09-17

## 맥락

백엔드는 별도 레포에서 개발 중이고 API 계약이 확정되지 않았다. 프론트 개발을 백엔드 완료까지 미룰 수 없고, 목업 없이 개발하면 연동 시점에 대량 수정이 발생한다.

## 결정

MSW로 모든 API를 목업한다.

- `VITE_ENABLE_MSW=true`일 때만 활성화 (`shared/config/env.ts`의 `env.enableMsw`)
- 핸들러는 `shared/api/mocks/handlers/`에 도메인별 파일로 분리 (`entry.ts`, `draw.ts`, `ticket.ts` …)
- 목업 응답은 기획서(`docs/spec/LG유플러스_응모이벤트플랫폼_기획서.md`)의 계약 초안을 따르고, 미합의 항목은 임의로 확정하지 않는다
- 실제 응답 검증은 `entities/*/model/`의 Zod 스키마가 담당 — 목업이 아니라 스키마가 계약의 기준이다

## 결과

- 백엔드 없이 전 화면 개발·시연이 가능하다
- 목업은 "계약의 임시 구현"일 뿐 진실이 아니다 — 계약 확정 시 핸들러를 수정하며 드리프트를 해소한다
- MSW 환경에서만 세션이 `admin`으로 시작하는 등 목업 전용 분기가 존재한다 (`entities/user/model/session.ts`)
