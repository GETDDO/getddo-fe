# 홈 화면 Figma 정합화 구현 계획

> **For agentic workers:** REQUIRED: dispatch a fresh subagent per task (recommended) or use the `executing-plans` skill to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Figma `홈` 프레임(node 211-1227) 디자인과 일치하도록 홈 화면의 레이아웃·스타일·누락 섹션을 구현한다.

**Architecture:** 기존 FSD 구조를 유지한다. 공통 GNB/푸터는 새 `widgets/user-layout` 슬라이스 + 라우트 레이아웃 패턴(admin-routes와 동일)으로 제공하고, 배너·이벤트 섹션·응모권 위젯은 기존 슬라이스를 수정한다. 발표 내역은 기존 `useEventList()`의 `closed`/`drawn` 상태로 파생한다.

**Tech Stack:** React 19, TypeScript, Vite, React Router 7, TanStack Query, TailwindCSS v4, shadcn/ui, Zod, MSW

**Spec:** `docs/spec/LG유플러스_응모이벤트플랫폼_기획서.md`, Figma `홈` 프레임 (BVBYqKpBakjzX8Jg7tFUhk / 211-1227)

## Global Constraints

- FSD 의존 방향 `app → pages → widgets → features → entities → shared`, 슬라이스 간 참조는 `index.ts` 경유
- 색상은 시맨틱 토큰만 사용 (`tokens.css` 참조)
- 배너 배경 노랑: `--color-play-yellow-soft`(#fff4d1) / CTA 다크네이비: `--color-action-neutral`(#1f242b, Button `secondary` variant)
- 배너 최대 5개, 자동 슬라이드, 좌우 화살표 (기획서 요구)
- 실시간 현황: 응모자 수·사용 응모권 수만 표시, 당첨 확률 금지
- 주석은 한국어, `console.log` 금지, 타입 import는 `import type`
- 검증: `npm run format:check && npm run lint && npm run test:ci && npm run build`

## 미확정 사항 (구현 시 아래 가정으로 진행, 결과 보고에 명시)

- GNB의 `타임래플` 항목: 전용 페이지가 없으므로 `/events`로 연결한다
- `발표 내역·결과` 데이터: 별도 API가 없으므로 `useEventList()`에서 `status === 'closed' | 'drawn'`으로 파생 + MSW 목업에 해당 상태 이벤트 추가 (스키마 변경 아님)
- 카드 이미지: `bannerImageUrl` 필드가 스키마에 있으나 목업은 모두 null — img 렌더링 코드는 넣되, null이면 그라디언트 플레이스홀더로 표시
- 배너 마스코트 일러스트: 에셋이 없어 `bannerImageUrl` 있을 때만 우측에 표시
- 보상 초기화 문구: 디자인은 "매일 00시"이나 기획서는 "오전 9시(KST)" — 기획서를 따른다 (기존 문구 유지)
- 관리자 배너 노출 순서: `/banners` API는 있으나 이벤트 연결 필드가 없어 이번 범위에서 제외, 기존 종료시각 순 유지

---

### Task 1: 사용자 공통 레이아웃 (GNB + 푸터)

**Files:**

- Create: `src/widgets/user-layout/model/nav-items.ts`
- Create: `src/widgets/user-layout/ui/UserLayout.tsx`
- Create: `src/widgets/user-layout/index.ts`
- Modify: `src/app/routes/user-routes.tsx`

> **파일 소유권 규칙:** `HomePage.tsx`는 각 태스크가 자기 범위의 배선과 함께 수정해 매 커밋이 빌드 가능한 상태를 유지한다. NotificationBell 제거 등 공통 정리는 Task 6이 담당한다.

**Interfaces:**

- Produces: `UserLayout` 컴포넌트 (`@widgets/user-layout`), `USER_NAV_ITEMS`

- [ ] **Step 1: nav-items.ts 작성**

```ts
import type { LucideIcon } from 'lucide-react';
```

아이콘 불필요 — 디자인은 텍스트 네비. 단순 배열:

```ts
export interface UserNavItem {
    to: string;
    label: string;
    /** index 라우트(/)는 정확히 일치할 때만 활성화한다 */
    end?: boolean;
}

export const USER_NAV_ITEMS: UserNavItem[] = [
    { to: '/', label: '홈', end: true },
    { to: '/events', label: '타임래플' },
    { to: '/events', label: '이벤트' },
    { to: '/missions', label: '미션' },
    { to: '/mypage', label: '마이페이지' },
];
```

- [ ] **Step 2: UserLayout.tsx 작성**

- 헤더: `sticky top-0` 흰 배경, `max-w-[1200px] mx-auto px-6 h-16` — 좌: `U+ GETDDO` 로고 텍스트 (AdminLayout과 동일한 스타일 `text-title-3`, `+`는 `text-fg-brand`), 중앙: `NavLink` 네비 (활성 `text-fg-primary font-semibold`, 비활성 `text-fg-tertiary`), 우: `NotificationBell` + `CircleUserRound` 아이콘(`/mypage` 링크, lucide-react)
- `<Outlet />`
- 푸터: `bg-fg-primary text-fg-on-brand` — 내부 `max-w-[1200px] mx-auto px-6 py-10`, 로고 + `© U+ GETDDO. All Rights Reserved.` 텍스트 (디자인의 다크네이비 바)

```tsx
import { CircleUserRound } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

import { NotificationBell } from '@widgets/notification-bell';
import { cn } from '@shared/lib/utils';

import { USER_NAV_ITEMS } from '../model/nav-items';

export function UserLayout() {
    return (
        <div className="bg-surface-page flex min-h-screen flex-col">
            <header className="border-border-default bg-surface-page sticky top-0 z-10 border-b">
                <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-8 px-6">
                    <NavLink to="/" className="text-title-3 text-fg-primary shrink-0">
                        U<span className="text-fg-brand">+</span> GETDDO
                    </NavLink>
                    <nav className="flex flex-1 items-center gap-6">
                        {USER_NAV_ITEMS.map(({ to, label, end }) => (
                            <NavLink
                                key={label}
                                to={to}
                                end={end}
                                className={({ isActive }) =>
                                    cn(
                                        'text-body-sm transition-colors',
                                        isActive
                                            ? 'text-fg-primary font-semibold'
                                            : 'text-fg-tertiary hover:text-fg-primary',
                                    )
                                }
                            >
                                {label}
                            </NavLink>
                        ))}
                    </nav>
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <NavLink to="/mypage" aria-label="마이페이지">
                            <CircleUserRound className="text-fg-primary size-6" />
                        </NavLink>
                    </div>
                </div>
            </header>
            <div className="flex-1">
                <Outlet />
            </div>
            <footer className="bg-fg-primary text-fg-on-brand">
                <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-2 px-6 py-10">
                    <p className="text-title-3">U+ GETDDO</p>
                    <p className="text-caption text-fg-tertiary">
                        © U+ GETDDO. All Rights Reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
```

- [ ] **Step 3: index.ts 작성** — `export { UserLayout } from './ui/UserLayout';`

- [ ] **Step 4: user-routes.tsx를 레이아웃 라우트로 감싸기** (admin-routes 패턴과 동일)

```tsx
export const userRoutes: RouteObject[] = [
    {
        element: <UserLayout />,
        children: [
            { path: '/', element: <HomePage /> },
            { path: '/events', element: <EventListPage /> },
            // ... 기존 경로 전부 children으로 이동
        ],
    },
];
```

- [ ] **Step 5: 확인** — `npm run lint`로 import 정렬·FSD 경계 검증, 브라우저에서 GNB/푸터 표시 확인

---

### Task 2: 히어로 배너 Figma 스타일 + 자동 슬라이드

**Files:**

- Modify: `src/widgets/banner-slider/ui/BannerSlider.tsx`
- Modify: `src/pages/home/ui/HomePage.tsx` (같은 커밋 — LiveEntryStatus를 배너 슬롯으로 이동, props 변경과 동시에 배선)
- Modify: `src/entities/event/api/queries.ts` (refetchInterval 추가)

**Interfaces:**

- Consumes: `LiveEntryStatus` (`@widgets/live-entry-status`) — 페이지가 슬롯으로 주입
- Produces: `BannerSlider` props `{ renderStatus?: (event: Event) => ReactNode }` — 기존 `onCurrentEventChange` 제거 가능 (슬롯으로 대체)

- [ ] **Step 1: BannerSlider 수정**

변경점:

- props: `onCurrentEventChange` → `renderStatus?: (event: Event) => ReactNode`
- 슬라이드: `.slice(0, 4)` → `.slice(0, 5)` (기획서 최대 5개)
- 자동 슬라이드: 5초 interval, 슬라이드 2개 이상일 때만. 수동 이동 시 타이머 리셋은 생략(단순화), `onMouseEnter/Leave`로 hover 일시정지
- 배경: `bg-brand-soft` → `bg-ticket-accent`(= #fff4d1 노랑)
- 레이아웃: 좌측 텍스트 블록 + 우측 `bannerImageUrl` 이미지 영역 (`<img>` 또는 숨김)
- 상단 행: 좌측에 카운트다운 pill (`bg-surface-page ... rounded-full`), 그 아래 flame + `오늘의 타임 래플` — 디자인은 카운트다운이 라벨보다 위에 있음. 순서: 카운트다운(좌) → flame 라벨 → 제목 → 설명 → 통계 pill 슬롯 → `응모하기`
- 통계 pill: `{renderStatus?.(current)}`를 설명 아래, CTA 위에 렌더
- CTA: `Button variant="secondary" size="lg"` → 다크네이비 (`--secondary` = action-neutral)
- 페이지네이션: `<section>` 내에서 `absolute right-8 bottom-8` 또는 flex `justify-end`로 우하단 이동. section에 `relative` 추가
- 카운트다운 위치: 좌상단

```tsx
const [paused, setPaused] = useState(false);

useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(timer);
}, [slides.length, paused]);
```

JSX 구조:

```tsx
<section
    className="bg-ticket-accent relative flex flex-col gap-6 rounded-2xl p-8 sm:p-10"
    onMouseEnter={() => setPaused(true)}
    onMouseLeave={() => setPaused(false)}
>
    <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-4">
            <span className="bg-surface-page text-fg-primary text-body-sm-bold flex w-fit items-center gap-1.5 rounded-full px-3 py-2 shadow-md">
                <Clock className="size-4" />
                마감까지 {formatCountdown(remainingMs)}
            </span>
            <div className="flex items-center gap-2">
                <Flame className="text-brand-primary size-5" />
                <span className="text-brand-primary text-body-sm-bold">오늘의 타임 래플</span>
            </div>
            <h2 className="text-title-2 text-fg-primary">{current.title}</h2>
            <p className="text-body text-fg-primary whitespace-pre-line">{current.description}</p>
            {renderStatus?.(current)}
            <div>
                <Button
                    asChild
                    variant="secondary"
                    size="lg"
                    className="h-auto px-7 py-4 text-base"
                >
                    <Link to={`/events/${current.id}`}>응모하기</Link>
                </Button>
            </div>
        </div>
        {current.bannerImageUrl && (
            <img src={current.bannerImageUrl} alt="" className="hidden w-72 shrink-0 sm:block" />
        )}
    </div>
    {slides.length > 1 && (
        <div className="absolute right-8 bottom-8 flex items-center gap-2 sm:right-10">
            {/* 기존 ‹ 01 / 04 › 마크업 그대로 */}
        </div>
    )}
</section>
```

- [ ] **Step 2: HomePage에서 슬롯 주입**

```tsx
<BannerSlider renderStatus={(event) => <LiveEntryStatus event={event} />} />
```

`heroEvent` state·`onCurrentEventChange` 관련 코드 제거.

- [ ] **Step 3: useEventList에 refetchInterval 추가** (기획서: 실시간 현황 자동 갱신)

```ts
return useQuery({
    queryKey: ['events', 'list'],
    queryFn: async () => {
        /* 동일 */
    },
    refetchInterval: 30_000,
});
```

- [ ] **Step 4: 확인** — 브라우저에서 노란 배너·자동 슬라이드·우하단 페이지네이션 확인, `npm run lint`

---

### Task 3: `타임 래플 · 응모권 사용` 섹션 — featured + 오픈 예정 레이아웃

**Files:**

- Create: `src/entities/event/ui/FeaturedEventCard.tsx`
- Create: `src/entities/event/ui/UpcomingEventCard.tsx`
- Modify: `src/entities/event/ui/EventCard.tsx` (이미지 영역 추가)
- Modify: `src/entities/event/index.ts` (export 추가)
- Create: `src/widgets/ticket-event-section/ui/TicketEventSection.tsx`
- Create: `src/widgets/ticket-event-section/index.ts`
- Modify: `src/pages/home/ui/HomePage.tsx` (EventCardList → TicketEventSection 교체)

**Interfaces:**

- Produces: `FeaturedEventCard({ event }: { event: Event })`, `UpcomingEventCard({ event }: { event: Event })` (`@entities/event`), `TicketEventSection({ events, isPending, isError })` (`@widgets/ticket-event-section`)

- [ ] **Step 1: EventCard에 이미지 영역 추가**

`CardHeader` 위에 이미지 블록 삽입 — `bannerImageUrl`이 있으면 `<img className="aspect-video w-full rounded-t-lg object-cover">`, 없으면 `bg-surface-sunken` 플레이스홀더 + `Gift` 아이콘 (lucide). 카드 전체 이미지 상단 배치 (디자인: 이미지 위·텍스트 아래).

- [ ] **Step 2: FeaturedEventCard 작성** — 디자인의 좌측 대형 카드

- `Card` + `border-border-brand-subtle` (핑크 보더)
- 상단 행: `응모중` 배지(`bg-brand-primary text-fg-on-brand`) + 시간대 `formatKst(startsAt, {hour,minute}) ~ formatKst(endsAt, {hour,minute})`
- 제목 `{title} ({winnerCount}명)` + 설명
- 우측 이미지: `bannerImageUrl` img 또는 `bg-surface-sunken` 플레이스홀더 (`aspect-square w-32 sm:w-40`, `Gift` 아이콘)
- 하단: 통계 행(기존 EventCard와 동일 마크업 — 총 참여자/사용된 응모권/내 응모) + `Button variant="secondary"` `응모하러 가기` → `/events/:id`

- [ ] **Step 3: UpcomingEventCard 작성** — 디자인의 우측 소형 카드

- `Card` + `bg-surface-page`
- 좌: 썸네일 플레이스홀더(`size-16 rounded-lg bg-surface-sunken` + Gift 아이콘) 또는 img
- 우: `오픈 예정` 배지(`bg-surface-sunken text-fg-secondary`) + `오늘 HH:mm 오픈 예정`(`text-fg-brand text-caption`, formatKst 시간만) + `{title} ({winnerCount}명)` + `응모권 {requiredTickets}장 응모 가능` 캡션
- 전체를 `/events/:id` Link로 감쌈

- [ ] **Step 4: TicketEventSection 작성**

```tsx
const openEvents = events
    .filter((e) => e.status === 'open')
    .sort((a, b) => +new Date(a.endsAt) - +new Date(b.endsAt));
const upcomingEvents = events
    .filter((e) => e.status === 'upcoming')
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
const featured = openEvents[0];
const spotlightUpcoming = upcomingEvents.slice(0, 2);
const rest = openEvents.slice(1).concat(upcomingEvents.slice(2));
```

- 헤더 행: `타임 래플 · 응모권 사용` + `전체보기 >`(`/events`)
- 스포트라이트 행: `grid gap-4 lg:grid-cols-2` — 좌 featured, 우 `flex flex-col gap-4`에 UpcomingEventCard 최대 2개
- 나머지 `rest`는 기존 `grid grid-cols-1 gap-4 sm:grid-cols-2` EventCard 그리드
- isPending/isError/empty 처리는 EventCardList와 동일

- [ ] **Step 5: HomePage 교체** — 첫 `EventCardList`(타임 래플)를 `<TicketEventSection events={ticketEvents} isPending={isPending} isError={isError} />`로

- [ ] **Step 6: 확인** — `npm run lint`, 브라우저에서 featured+upcoming 레이아웃 확인

---

### Task 4: `발표 내역·결과` 섹션

**Files:**

- Create: `src/entities/event/ui/EventResultRow.tsx`
- Modify: `src/entities/event/index.ts`
- Modify: `src/shared/api/mocks/handlers/event.ts` (closed/drawn 목업 이벤트 2개 추가)
- Modify: `src/pages/home/ui/HomePage.tsx`

**Interfaces:**

- Produces: `EventResultRow({ event }: { event: Event })` (`@entities/event`)

- [ ] **Step 1: 목업 데이터 추가** — `mockEvents`에 status `closed` 1개, `drawn` 1개 추가 (예: `evt-008` '9월 신규고객 웰컴 선물 증정' closed, `evt-009` drawn). 기존 스키마 필드 전부 채운다 (requiredTickets, participantCount 등)

- [ ] **Step 2: EventResultRow 작성** — 디자인의 가로형 리스트 행

- `Link to=/events/:id`, `flex items-center gap-4 border-b` 행
- 좌: 썸네일 `size-14 rounded-lg bg-surface-sunken` + Gift 아이콘 (또는 bannerImageUrl img)
- 중: 배지 — `closed`: `응모 마감`(`bg-surface-sunken text-fg-secondary`), `drawn`: `추첨 완료`(`bg-brand-soft text-fg-brand`) + `{title}` + 날짜 `yy.MM.dd(요일) ~ yy.MM.dd(요일)` (formatKst에 year:'2-digit', weekday:'short' 옵션)
- 우: `ChevronRight` 아이콘

- [ ] **Step 3: HomePage에 섹션 추가** — 무료 이벤트 목록 아래

```tsx
const resultEvents = (events ?? []).filter(
    (event) => event.status === 'closed' || event.status === 'drawn',
);
```

```tsx
{
    resultEvents.length > 0 && (
        <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-subhead text-fg-primary">발표 내역·결과</h2>
                <Link
                    to="/events"
                    className="text-fg-primary text-body-sm flex items-center gap-0.5"
                >
                    전체보기
                    <ChevronRight className="size-5" />
                </Link>
            </div>
            <div className="border-border-default flex flex-col rounded-2xl border">
                {resultEvents.map((event) => (
                    <EventResultRow key={event.id} event={event} />
                ))}
            </div>
        </section>
    );
}
```

- [ ] **Step 4: 확인** — 브라우저에서 발표 내역 섹션 표시 확인

---

### Task 5: `오늘 받을 수 있는 응모권` 위젯 보완

**Files:**

- Modify: `src/widgets/ticket-balance-widget/ui/TicketBalanceWidget.tsx`

- [ ] **Step 1: 헤더에 `전체보기 >` 추가** — 헤더 행 우측(`/missions` 링크). 기존 `flex flex-wrap` 구조를 `justify-between`으로 조정하고 우측에 Link 배치

- [ ] **Step 2: 카드 상단 썸네일 영역 추가** — 이미지 필드가 없으므로 카테고리별 색 플레이스홀더: ATTENDANCE `bg-play-lavender-soft` + `CalendarCheck` 아이콘, MISSION `bg-play-pink-soft` + `ClipboardList`, GAME `bg-play-yellow-soft` + `Gamepad2`. `h-20 rounded-lg` 블록, 아이콘 중앙

- [ ] **Step 3: 확인** — 브라우저에서 전체보기 링크·썸네일 확인

---

### Task 6: HomePage 정리 + 최종 검증

**Files:**

- Modify: `src/pages/home/ui/HomePage.tsx`

- [ ] **Step 1: NotificationBell 행 제거** — `<div className="flex items-center justify-end"><NotificationBell /></div>`와 import 삭제 (GNB로 이동했으므로). 페이지 최상단 주석(레이아웃 범위)도 갱신

- [ ] **Step 2: 최종 JSX 구조**

```tsx
<main className="mx-auto flex w-full max-w-[1200px] flex-col gap-12 px-6 py-10">
    <BannerSlider renderStatus={(event) => <LiveEntryStatus event={event} />} />
    <TicketEventSection events={ticketEvents} isPending={isPending} isError={isError} />
    <TicketBalanceWidget />
    <EventCardList title="응모권 없이 참여할 수 있는 이벤트" ... />
    {resultEvents.length > 0 && <발표 내역·결과 섹션>}
</main>
```

- [ ] **Step 3: 전체 검증**

```bash
npm run format:check
npm run lint
npm run test:ci
npm run build
```

- [ ] **Step 4: 브라우저 최종 비교** — localhost:5174 스크린샷을 Figma 홈 프레임과 섹션별 대조
