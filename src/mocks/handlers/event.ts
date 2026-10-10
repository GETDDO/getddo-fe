import { http } from 'msw';

import type { EventStatus } from '@entities/event';

import { env } from '@shared/config/env';

import { mockNow } from '../now';
import { fail, ok } from './response';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

const MINUTE = 60 * 1000;

const DEMO_EPOCH_KEY = 'getddo-mock-demo-epoch';

/**
 * 시연 창의 길이 — 기준 시각에서 이만큼 지나면 응모할 수 있는 래플이 하나도 남지 않는다.
 * 아래 HERO 창(기준 +60분)과 같은 값이어야 한다.
 */
const DEMO_WINDOW_MS = 60 * MINUTE;

/**
 * 시연 기준 시각.
 *
 * Date.now() + n으로 매번 계산하면 페이지를 새로 열 때마다 마감이 그만큼 뒤로 밀려서
 * 카운트다운이 리셋된다 — docs/CONTEXT.md가 금지하는 동작이다. 그래서 세션에 저장해 고정한다.
 *
 * 다만 지난 값을 무조건 재사용하면, 탭을 한참 열어 둔 뒤 돌아왔을 때 모든 창이 과거로
 * 넘어가 응모할 래플이 하나도 없게 된다. 창이 전부 끝난 경우에만 기준을 다시 잡는다 —
 * 진행 중인 창은 그대로 두므로 새로고침으로 카운트다운이 밀리지는 않는다.
 *
 * 앵커를 따로따로 저장하지 않고 이 한 값에서 파생시킨다. 개별 저장은 그중 일부만
 * 다시 잡혔을 때 시작이 마감보다 늦는 창을 만든다.
 *
 * 기준을 다시 잡을지는 가상 시계가 아니라 실제로 흐른 시간으로 판단한다.
 * 앞당긴 시각으로 저장해 버리면 실제 시각으로 돌아왔을 때 모든 창이 미래가 되어
 * 래플이 전부 '오픈 예정'이 된다. 가상 시계는 이 창 위를 지나가는 역할만 한다 —
 * 시각을 앞으로 옮기면 마감·발표로 넘어가고, 창 자체는 그대로 남는다.
 */
function demoEpoch(): number {
    const now = Date.now();

    try {
        const saved = sessionStorage.getItem(DEMO_EPOCH_KEY);
        if (saved) {
            const at = new Date(saved).getTime();
            if (!Number.isNaN(at) && now < at + DEMO_WINDOW_MS) return at;
        }
    } catch {
        // 저장소를 쓸 수 없는 환경(테스트 등)에서는 매번 현재 시각을 쓴다
    }

    try {
        sessionStorage.setItem(DEMO_EPOCH_KEY, new Date(now).toISOString());
    } catch {
        // 저장에 실패해도 이번 로드 동안은 같은 값을 쓴다
    }
    return now;
}

const DEMO_EPOCH = demoEpoch();

/** 시연 기준 시각에서 offsetMs 만큼 떨어진 시각 */
function demoTime(offsetMs: number): string {
    return new Date(DEMO_EPOCH + offsetMs).toISOString();
}

/**
 * 세션에 고정된 상대 시각 — 관리자 목업(adminEvent.ts)이 등록·중단·취소 시각에 쓴다.
 *
 * 키마다 따로 저장하지 않고 기준 시각에서 파생시킨다. 개별 저장은 창이 지난 뒤에도
 * 과거 값을 그대로 돌려줘서, 탭을 오래 열어 두면 되살아나지 않는다.
 * key는 호출부에서 어떤 시각인지 읽히도록 남겨 둔다.
 */
export function sessionFixedTime(key: string, offsetMs: number): string {
    void key;
    return demoTime(offsetMs);
}

// 홈 화면 "오늘의 타임 래플" 배너 데모용 — 세션이 유지되는 동안 마감 시각이 움직이지 않는다
const HERO_STARTS_AT = demoTime(-30 * MINUTE);
const HERO_ENDS_AT = demoTime(DEMO_WINDOW_MS);
const UPCOMING_OPENS_AT = demoTime(3 * 60 * MINUTE);

/*
 * 시연 플로우용 시각 — 응모 → 마감 → 발표 대기 → 발표 완료를 몇 분 안에 한 번 돌려보기 위한 것이다.
 * 세션 시작 시점에 고정되므로 새로고침해도 기준이 밀리지 않고, 시간이 실제로 흐른다.
 * 더 빨리 보고 싶으면 관리자 가상 시계(/admin/virtual-clock)로 시간을 앞으로 옮기면 된다.
 */
// 지금 응모할 수 있고 10분 뒤 마감된다 (발표는 ADR-009에 따라 마감 + 5분)
const FLOW_STARTS_AT = demoTime(-5 * MINUTE);
const FLOW_ENDS_AT = demoTime(10 * MINUTE);
// 이미 마감돼 발표를 기다리는 래플 — 화면을 열자마자 발표 대기 상태를 볼 수 있다
const AWAITING_STARTS_AT = demoTime(-62 * MINUTE);
const AWAITING_ENDS_AT = demoTime(-2 * MINUTE);
// 아직 열리지 않은 래플 — 오늘 몇 시 식으로 고정하면 늦은 시각에 데모할 때 오픈 예정이 하나도 남지 않는다
const PENDING_STARTS_AT = demoTime(2 * 60 * MINUTE);
const PENDING_ENDS_AT = demoTime(3 * 60 * MINUTE);
/*
 * 고정 시각(오늘 16시·17시)으로 두면 새벽·오전에 데모를 돌릴 때 진행 중인 래플이
 * 구조적으로 0개가 된다. 대표 래플은 '진행 중' 섹션에서 빠지므로 섹션도 같이 비어 버린다.
 * 그래서 두 개는 시각과 무관하게 열려 있도록 기준 시각에 붙여 둔다.
 */
const OPEN_A_STARTS_AT = demoTime(-45 * MINUTE);
const OPEN_A_ENDS_AT = demoTime(40 * MINUTE);
const OPEN_B_STARTS_AT = demoTime(-20 * MINUTE);
const OPEN_B_ENDS_AT = demoTime(55 * MINUTE);

/**
 * KST 기준 dayOffset일 뒤 hour시의 UTC ISO 문자열.
 * 타임래플은 당일 시간대별로 열리고 닫혀서, 언제 데모를 돌려도 "오픈 15:00" 같은 표기가 자연스럽도록 실행일 기준으로 만든다.
 */
function kstAt(dayOffset: number, hour: number): string {
    const kstNow = new Date(mockNow().getTime() + 9 * 60 * 60 * 1000);
    return new Date(
        Date.UTC(
            kstNow.getUTCFullYear(),
            kstNow.getUTCMonth(),
            kstNow.getUTCDate() + dayOffset,
            hour - 9,
        ),
    ).toISOString();
}

// 상세 화면 안내 문단 — 추첨·차감 정책은 모든 래플이 같아서 공통으로 쓴다
const DRAW_PARAGRAPH =
    '마감 직후 추첨이 자동으로 진행되며, 당첨자에게는 개별 알림톡과 무료 직배송 서비스를 지원합니다. 중복 응모는 가능하지만, 당첨 확률은 표시하지 않으며 응모권 사용 여부와 참여 횟수에 따라 당첨 기회가 달라질 수 있습니다.';
const TICKET_PARAGRAPH =
    '1회 응모 시 필요한 수량만 차감되며, 중복 요청 시 이중 차감되지 않습니다. 보유 응모권이 부족하면 응모가 제한되며, 응모권 사용 여부와 참여 횟수에 따라 당첨 기회가 달라질 수 있습니다.';

/** 타임래플 상세 화면 안내 — 첫 문단과 상품 구성만 이벤트마다 다르다 */
function raffleDetail(intro: string, prizeComposition: string) {
    return {
        paragraphs: [intro, DRAW_PARAGRAPH, TICKET_PARAGRAPH],
        prizeComposition,
        shippingSchedule: '당첨자 발표 후 3 영업일 이내 일괄 발송',
        membershipNote: '일반/멤버십 구분에 따라 응모 가중치 적용',
    };
}

/**
 * 사용자 화면용 목 이벤트 항목.
 * 관리자 목업(adminEvent.ts)이 등록·수정·취소를 이 배열에도 반영해 사용자 목록과 동기화한다.
 */
export interface MockEvent {
    id: string;
    title: string;
    description: string;
    bannerImageUrl: string | null;
    detailImageUrl?: string | null;
    startsAt: string;
    endsAt: string;
    status: EventStatus;
    isRecommended?: boolean;
    isTimeRaffle?: boolean;
    raffleDetail?: ReturnType<typeof raffleDetail>;
    requiredTickets: number;
    tags?: string[];
    prizeName: string;
    winnerCount: number;
    // 응모 현황 원천 — 이벤트 응답(E01/E02)에는 싣지 않고 E03 응모 통계로만 내려간다 (ADR-0007)
    participantCount: number | null;
    usedTicketCount: number | null;
    myEntryCount: number | null;
    myTicketCount: number | null;
}

// requiredTickets > 0 은 모은 응모권을 차감해 응모하는 이벤트, 0 은 응모권 없이 참여하는 이벤트다.
// 이벤트 목록 화면이 이 값으로 위·아래 섹션을 가른다.
// isTimeRaffle 이 true 면 타임래플 화면에만 노출하고 이벤트 목록에서는 뺀다.
export const mockEvents: MockEvent[] = [
    {
        id: 'evt-001',
        isRecommended: true,
        title: '갤럭시 버즈 위클리 래플',
        description: '응모권 1장으로 참여하는 주간 추첨 이벤트',
        bannerImageUrl: null,
        // 상세 화면 본문 이미지 — 실제 URL은 백엔드 연동 후 들어온다. 로컬에서 확인하려면 임의의 이미지 URL을 넣으면 된다
        detailImageUrl: null,
        startsAt: '2026-09-01T00:00:00Z',
        endsAt: '2026-10-31T14:59:59Z',
        status: 'open',
        requiredTickets: 1,
        tags: ['디지털기기'],
        prizeName: '갤럭시 버즈',
        winnerCount: 10,
        participantCount: 842,
        usedTicketCount: 1290,
        myEntryCount: 1,
        myTicketCount: 1,
    },
    {
        id: 'evt-002',
        isRecommended: true,
        title: '출석왕 챌린지',
        description: '이번 달 출석 미션 완주자 대상 추첨. 응모권 3장으로 참여해요.',
        bannerImageUrl: null,
        startsAt: '2026-09-01T00:00:00Z',
        endsAt: '2026-10-31T14:59:59Z',
        status: 'open',
        requiredTickets: 3,
        tags: ['기프티콘·상품권'],
        prizeName: '네이버페이 포인트 5만원',
        winnerCount: 100,
        participantCount: 2310,
        usedTicketCount: 5400,
        myEntryCount: 0,
        myTicketCount: 0,
    },
    {
        id: 'evt-005',
        title: '스타벅스 e카드 래플',
        description: '응모권 1장으로 참여하는 스타벅스 e카드 추첨 이벤트',
        bannerImageUrl: null,
        startsAt: UPCOMING_OPENS_AT,
        endsAt: '2026-10-20T14:59:59Z',
        status: 'upcoming',
        requiredTickets: 1,
        tags: ['기프티콘·상품권'],
        prizeName: '스타벅스 e카드',
        winnerCount: 50,
        participantCount: null,
        usedTicketCount: null,
        myEntryCount: null,
        myTicketCount: null,
    },
    {
        id: 'evt-006',
        isRecommended: true,
        title: '데이터 쿠폰 무료 응모',
        description: '응모권 없이 누구나 참여할 수 있는 데이터 쿠폰 추첨 이벤트',
        bannerImageUrl: null,
        startsAt: '2026-09-01T00:00:00Z',
        endsAt: '2026-10-31T14:59:59Z',
        status: 'open',
        requiredTickets: 0,
        tags: ['데이터·통신'],
        prizeName: 'U+ 데이터 쿠폰 1GB',
        winnerCount: 200,
        participantCount: 4820,
        usedTicketCount: 0,
        myEntryCount: 1,
        myTicketCount: 0,
    },
    {
        id: 'evt-007',
        title: '아메리카노 쿠폰 데일리 응모',
        description: '응모권 없이 매일 참여할 수 있는 커피 쿠폰 추첨 이벤트',
        bannerImageUrl: null,
        startsAt: '2026-09-01T00:00:00Z',
        endsAt: '2026-10-31T14:59:59Z',
        status: 'open',
        requiredTickets: 0,
        tags: ['기프티콘·상품권'],
        prizeName: '스타벅스 아메리카노 쿠폰',
        winnerCount: 500,
        participantCount: 2110,
        usedTicketCount: 0,
        myEntryCount: 0,
        myTicketCount: 0,
    },
    {
        id: 'evt-010',
        title: 'VVIP 전용 데이터 쿠폰 래플',
        description: 'VVIP·VIP 등급 대상 데이터 쿠폰 추첨 이벤트. 응모권 3장이 필요해요.',
        bannerImageUrl: null,
        startsAt: demoTime(5 * 60 * MINUTE),
        endsAt: '2026-10-20T14:59:59Z',
        status: 'upcoming',
        requiredTickets: 3,
        tags: ['데이터·통신', '멤버십 혜택'],
        prizeName: 'U+ 데이터 쿠폰 5GB',
        winnerCount: 10,
        participantCount: null,
        usedTicketCount: null,
        myEntryCount: null,
        myTicketCount: null,
    },
    {
        id: 'evt-008',
        title: '9월 데이터 쿠폰 래플',
        description: '응모권 1장으로 참여했던 데이터 쿠폰 추첨 이벤트',
        bannerImageUrl: null,
        startsAt: '2026-09-01T00:00:00Z',
        endsAt: '2026-09-20T14:59:59Z',
        status: 'closed',
        requiredTickets: 1,
        tags: ['데이터·통신'],
        prizeName: 'U+ 데이터 쿠폰 5GB',
        winnerCount: 50,
        participantCount: 3204,
        usedTicketCount: 4120,
        myEntryCount: 1,
        myTicketCount: 1,
    },
    {
        id: 'evt-009',
        title: '8월 출석왕 챌린지',
        description: '8월 출석 미션 완주자 대상 추첨 이벤트',
        bannerImageUrl: null,
        startsAt: '2026-08-01T00:00:00Z',
        endsAt: '2026-08-31T14:59:59Z',
        status: 'drawn',
        requiredTickets: 2,
        tags: ['기프티콘·상품권'],
        prizeName: '네이버페이 포인트 3만원',
        winnerCount: 30,
        participantCount: 1890,
        usedTicketCount: 3560,
        myEntryCount: 0,
        myTicketCount: 0,
    },
    {
        id: 'evt-011',
        title: '9월 멤버십 위크',
        description: '멤버십 등급별 포인트 혜택 이벤트. 응모권 없이 참여할 수 있어요.',
        bannerImageUrl: null,
        startsAt: '2026-09-08T00:00:00Z',
        endsAt: '2026-10-21T14:59:59Z',
        status: 'open',
        requiredTickets: 0,
        tags: ['멤버십 혜택'],
        prizeName: 'U+ 멤버십 포인트 5,000P',
        winnerCount: 1000,
        participantCount: 1540,
        usedTicketCount: 0,
        myEntryCount: 0,
        myTicketCount: 0,
    },
    {
        id: 'evt-012',
        isRecommended: true,
        title: '갤럭시 버즈3 오픈 응모',
        description: '응모권 없이 참여하는 갤럭시 버즈3 추첨 이벤트',
        bannerImageUrl: null,
        startsAt: '2026-09-15T00:00:00Z',
        endsAt: '2026-10-05T14:59:59Z',
        status: 'open',
        requiredTickets: 0,
        tags: ['디지털기기'],
        prizeName: '갤럭시 버즈3',
        winnerCount: 20,
        participantCount: 980,
        usedTicketCount: 0,
        myEntryCount: 0,
        myTicketCount: 0,
    },
    {
        id: 'evt-013',
        title: '갤럭시 워치 스트랩 증정 응모',
        description: '응모권 없이 참여하는 한정 스트랩 증정 이벤트',
        bannerImageUrl: null,
        startsAt: '2026-09-18T00:00:00Z',
        endsAt: '2026-10-25T14:59:59Z',
        status: 'open',
        requiredTickets: 0,
        tags: ['한정 굿즈'],
        prizeName: '갤럭시 워치 스트랩',
        winnerCount: 100,
        participantCount: 640,
        usedTicketCount: 0,
        myEntryCount: 0,
        myTicketCount: 0,
    },

    {
        id: 'evt-201',
        isRecommended: true,
        title: '갤럭시 탭 S11 응모',
        description: '응모권 1장으로 참여하는 태블릿 추첨 이벤트',
        bannerImageUrl: null,
        startsAt: '2026-09-05T00:00:00Z',
        endsAt: '2026-10-05T14:59:59Z',
        status: 'open',
        requiredTickets: 1,
        tags: ['디지털기기'],
        prizeName: '갤럭시 탭 S11',
        winnerCount: 3,
        participantCount: 1820,
        usedTicketCount: 2640,
        myEntryCount: 1,
        myTicketCount: 1,
    },
    {
        id: 'evt-202',
        title: '배달앱 5천원 쿠폰 응모',
        description: '응모권 없이 참여하는 배달 쿠폰 추첨 이벤트',
        bannerImageUrl: null,
        startsAt: '2026-09-10T00:00:00Z',
        endsAt: '2026-10-25T14:59:59Z',
        status: 'open',
        requiredTickets: 0,
        tags: ['기프티콘·상품권'],
        prizeName: '배달앱 5,000원 쿠폰',
        winnerCount: 300,
        participantCount: 3120,
        usedTicketCount: 0,
        myEntryCount: 0,
        myTicketCount: 0,
    },
    {
        id: 'evt-203',
        title: '무너 캘린더 증정 응모',
        description: '응모권 없이 참여하는 2027년 무너 캘린더 증정 이벤트',
        bannerImageUrl: null,
        startsAt: '2026-09-12T00:00:00Z',
        endsAt: '2026-10-12T14:59:59Z',
        status: 'open',
        requiredTickets: 0,
        tags: ['한정 굿즈'],
        prizeName: '무너 2027 캘린더',
        winnerCount: 200,
        participantCount: 1460,
        usedTicketCount: 0,
        myEntryCount: 0,
        myTicketCount: 0,
    },
    {
        id: 'evt-204',
        isRecommended: true,
        title: '데이터 2GB 충전 쿠폰 응모',
        description: '응모권 1장으로 참여하는 데이터 충전 쿠폰 추첨 이벤트',
        bannerImageUrl: null,
        startsAt: '2026-09-08T00:00:00Z',
        endsAt: '2026-10-24T14:59:59Z',
        status: 'open',
        requiredTickets: 1,
        tags: ['데이터·통신'],
        prizeName: 'U+ 데이터 쿠폰 2GB',
        winnerCount: 500,
        participantCount: 2740,
        usedTicketCount: 3180,
        myEntryCount: 0,
        myTicketCount: 0,
    },
    {
        id: 'evt-205',
        title: '멤버십 VIP콕 더블 혜택',
        description: '멤버십 등급 대상 혜택 이벤트. 응모권 없이 참여할 수 있어요.',
        bannerImageUrl: null,
        startsAt: '2026-09-14T00:00:00Z',
        endsAt: '2026-10-14T14:59:59Z',
        status: 'open',
        requiredTickets: 0,
        tags: ['멤버십 혜택'],
        prizeName: 'VIP콕 더블 이용권',
        winnerCount: 800,
        participantCount: 1980,
        usedTicketCount: 0,
        myEntryCount: 1,
        myTicketCount: 0,
    },
    {
        id: 'evt-206',
        isRecommended: true,
        title: 'CGV 영화 관람권 응모',
        description: '응모권 2장으로 참여하는 영화 관람권 추첨 이벤트',
        bannerImageUrl: null,
        startsAt: '2026-09-03T00:00:00Z',
        endsAt: '2026-10-27T14:59:59Z',
        status: 'open',
        requiredTickets: 2,
        tags: ['기프티콘·상품권'],
        prizeName: 'CGV 관람권 2매',
        winnerCount: 150,
        participantCount: 4210,
        usedTicketCount: 8640,
        myEntryCount: 2,
        myTicketCount: 4,
    },
    {
        id: 'evt-207',
        isRecommended: true,
        title: '에어팟 4 응모',
        description: '응모권 2장으로 참여하는 이어폰 추첨 이벤트',
        bannerImageUrl: null,
        startsAt: '2026-09-06T00:00:00Z',
        endsAt: '2026-10-06T14:59:59Z',
        status: 'open',
        requiredTickets: 2,
        tags: ['디지털기기'],
        prizeName: '에어팟 4',
        winnerCount: 5,
        participantCount: 3640,
        usedTicketCount: 7120,
        myEntryCount: 0,
        myTicketCount: 0,
    },
    {
        id: 'evt-208',
        title: '무너 리유저블 컵 증정',
        description: '응모권 없이 참여하는 한정 리유저블 컵 증정 이벤트',
        bannerImageUrl: null,
        startsAt: '2026-09-16T00:00:00Z',
        endsAt: '2026-10-16T14:59:59Z',
        status: 'open',
        requiredTickets: 0,
        tags: ['한정 굿즈'],
        prizeName: '무너 리유저블 컵',
        winnerCount: 400,
        participantCount: 1230,
        usedTicketCount: 0,
        myEntryCount: 0,
        myTicketCount: 0,
    },

    // ── 타임래플 ── 정해진 시간에만 열리는 한정 굿즈 래플. 전부 응모권을 사용한다.
    {
        id: 'evt-003',
        title: '무너 한정 굿즈 타임 래플',
        description:
            '무너 캐릭터를 메탈릭 코팅으로 새로 빚은 커스텀 피규어입니다. 아크릴 케이스와 인증 카드를 갖춘 소량 제작분이라 이번 시즌이 지나면 다시 만들지 않습니다.',
        bannerImageUrl: null,
        startsAt: HERO_STARTS_AT,
        endsAt: HERO_ENDS_AT,
        status: 'open',
        isTimeRaffle: true,
        raffleDetail: raffleDetail(
            '무너 커스텀 피규어를 메탈릭 코팅으로 마감한 타임래플 전용 구성입니다. 제작 수량이 정해져 있어 이번 회차가 끝나면 추가로 만들지 않습니다.',
            '무너 커스텀 메탈릭 피규어 1종 + 아크릴 디스플레이 케이스 + 인증 카드',
        ),
        requiredTickets: 1,
        tags: ['한정 굿즈'],
        prizeName: '무너 한정 굿즈 세트',
        winnerCount: 5,
        participantCount: 1234,
        usedTicketCount: 6412,
        myEntryCount: 2,
        myTicketCount: 2,
    },
    {
        id: 'evt-004',
        title: '닌텐도 스위치 2',
        description:
            '국내 정식 발매 구성 그대로의 미개봉 새 제품입니다. 조이콘 두 개와 전용 캐리 파우치가 함께 들어 있어 받는 날 바로 꺼내 쓸 수 있습니다.',
        bannerImageUrl: null,
        startsAt: kstAt(0, 15),
        endsAt: kstAt(0, 22),
        status: 'open',
        isTimeRaffle: true,
        raffleDetail: raffleDetail(
            '정해진 한 시간 동안만 열리는 래플입니다. 국내 정식 발매 구성 그대로, 개봉하지 않은 새 제품을 단 한 분께 드립니다.',
            '닌텐도 스위치 2 본체 + 조이콘 2 + 전용 캐리 파우치',
        ),
        requiredTickets: 1,
        tags: ['디지털기기'],
        prizeName: '닌텐도 스위치 2',
        winnerCount: 1,
        participantCount: 1284,
        usedTicketCount: 3102,
        myEntryCount: 2,
        myTicketCount: 2,
    },
    {
        id: 'evt-101',
        title: '에어팟 프로 3',
        description:
            '지하철과 카페의 소음을 눌러 주는 노이즈 캔슬링 이어폰입니다. 실리콘 팁이 세 가지 크기로 들어 있어 귀에 맞는 것을 골라 쓸 수 있습니다.',
        bannerImageUrl: null,
        startsAt: OPEN_A_STARTS_AT,
        endsAt: OPEN_A_ENDS_AT,
        status: 'open',
        isTimeRaffle: true,
        raffleDetail: raffleDetail(
            '소음이 많은 출퇴근길에서도 몰입할 수 있는 노이즈 캔슬링 이어폰입니다. 정품 등록까지 마친 새 제품으로 보내드립니다.',
            '에어팟 프로 3 본체 + 충전 케이스 + 실리콘 팁 3종',
        ),
        requiredTickets: 2,
        tags: ['디지털기기'],
        prizeName: '에어팟 프로 3',
        winnerCount: 3,
        participantCount: 2048,
        usedTicketCount: 5120,
        myEntryCount: 0,
        myTicketCount: 0,
    },
    {
        id: 'evt-102',
        title: '무너 인형 세트',
        description:
            '무너와 친구들 네 캐릭터를 인형으로 옮긴 세트입니다. 이번 시즌 생산분만으로 구성했고 추가 제작 계획은 없습니다.',
        bannerImageUrl: null,
        startsAt: OPEN_B_STARTS_AT,
        endsAt: OPEN_B_ENDS_AT,
        status: 'open',
        isTimeRaffle: true,
        raffleDetail: raffleDetail(
            '무너와 친구들을 한 번에 만날 수 있는 인형 세트입니다. 이번 시즌 생산분으로만 구성했고 추가 제작 계획은 없습니다.',
            '무너와 친구들 인형 4종 + 전용 보관 파우치',
        ),
        requiredTickets: 1,
        tags: ['한정 굿즈'],
        prizeName: '무너 인형 4종 세트',
        winnerCount: 20,
        participantCount: 3320,
        usedTicketCount: 4180,
        myEntryCount: 1,
        myTicketCount: 1,
    },
    {
        id: 'evt-103',
        title: '아이패드 에어 M3',
        description:
            '필기와 영상 편집을 한 대로 소화하는 11형 태블릿입니다. 정품 스마트 폴리오가 함께 들어가 커버와 스탠드로 그대로 쓸 수 있습니다.',
        bannerImageUrl: null,
        startsAt: kstAt(0, 20),
        endsAt: kstAt(0, 21),
        status: 'upcoming',
        isTimeRaffle: true,
        raffleDetail: raffleDetail(
            '필기와 영상 작업을 한 대로 끝낼 수 있는 태블릿입니다. 정품 스마트 폴리오를 함께 드립니다.',
            '아이패드 에어 M3 11형 128GB + 정품 스마트 폴리오',
        ),
        requiredTickets: 3,
        tags: ['디지털기기'],
        prizeName: '아이패드 에어 M3',
        winnerCount: 1,
        participantCount: null,
        usedTicketCount: null,
        myEntryCount: null,
        myTicketCount: null,
    },
    {
        id: 'evt-104',
        title: '무너 키링 세트',
        description:
            '가방이나 파우치에 달 수 있는 아크릴 키링 여섯 개입니다. 캐릭터마다 표정을 다르게 만들어 모으는 재미를 남겼습니다.',
        bannerImageUrl: null,
        startsAt: kstAt(0, 21),
        endsAt: kstAt(0, 22),
        status: 'upcoming',
        isTimeRaffle: true,
        raffleDetail: raffleDetail(
            '가방이나 파우치에 달기 좋은 무너 키링 6종 세트입니다. 컬렉터 카드가 함께 들어갑니다.',
            '무너 아크릴 키링 6종 + 컬렉터 카드',
        ),
        requiredTickets: 1,
        tags: ['한정 굿즈'],
        prizeName: '무너 키링 6종 세트',
        winnerCount: 50,
        participantCount: null,
        usedTicketCount: null,
        myEntryCount: null,
        myTicketCount: null,
    },
    {
        id: 'evt-105',
        title: 'LG 스탠바이미 2',
        description:
            '바퀴 달린 스탠드에 올려 방마다 옮겨 가며 보는 화면입니다. 배터리를 내장해 콘센트가 없는 자리에서도 쓸 수 있습니다.',
        bannerImageUrl: null,
        startsAt: PENDING_STARTS_AT,
        endsAt: PENDING_ENDS_AT,
        status: 'upcoming',
        isTimeRaffle: true,
        raffleDetail: raffleDetail(
            '자리를 옮겨 가며 볼 수 있는 무빙 스크린입니다. 전용 스탠드까지 함께 드립니다.',
            'LG 스탠바이미 2 본체 + 전용 무빙 스탠드',
        ),
        requiredTickets: 3,
        tags: ['디지털기기'],
        prizeName: 'LG 스탠바이미 2',
        winnerCount: 1,
        participantCount: null,
        usedTicketCount: null,
        myEntryCount: null,
        myTicketCount: null,
    },
    {
        id: 'evt-106',
        title: '갤럭시 워치8',
        description:
            '운동 기록과 수면 추적을 손목에서 한 번에 확인하는 스마트워치입니다. 스트랩이 하나 더 들어 있어 상황에 따라 바꿔 낄 수 있습니다.',
        bannerImageUrl: null,
        startsAt: AWAITING_STARTS_AT,
        endsAt: AWAITING_ENDS_AT,
        status: 'closed',
        isTimeRaffle: true,
        raffleDetail: raffleDetail(
            '운동과 수면 기록을 함께 챙길 수 있는 스마트워치입니다. 추가 스트랩을 함께 드렸습니다.',
            '갤럭시 워치8 40mm + 추가 스트랩 1종',
        ),
        requiredTickets: 2,
        tags: ['디지털기기'],
        prizeName: '갤럭시 워치8',
        winnerCount: 2,
        participantCount: 1740,
        usedTicketCount: 3980,
        myEntryCount: 1,
        myTicketCount: 2,
    },
    {
        id: 'evt-107',
        title: '무너 굿즈 박스',
        description:
            '머그컵과 에코백, 스티커 팩을 한 상자에 담은 시즌 구성입니다. 머그컵과 에코백은 이번 시즌에만 제작했습니다.',
        bannerImageUrl: null,
        startsAt: kstAt(-1, 13),
        endsAt: kstAt(-1, 14),
        status: 'closed',
        isTimeRaffle: true,
        raffleDetail: raffleDetail(
            '무너 시즌 굿즈를 한 상자에 담았습니다. 머그컵과 에코백은 이번 시즌에만 제작된 구성입니다.',
            '무너 머그컵 + 스티커 팩 + 에코백',
        ),
        requiredTickets: 1,
        tags: ['한정 굿즈'],
        prizeName: '무너 시즌 굿즈 박스',
        winnerCount: 30,
        participantCount: 2960,
        usedTicketCount: 3410,
        myEntryCount: 0,
        myTicketCount: 0,
    },
    {
        // 등수가 여럿이고 당첨자가 많은 래플 — 결과 화면의 등수 카드와 명단 스크롤을 확인한다
        id: 'evt-113',
        title: '무너 컬렉터 패키지 대형 래플',
        description:
            '피규어와 키링, 굿즈 박스를 등수별로 나눠 드리는 대형 래플입니다. 1등부터 3등까지 당첨자를 한 번에 뽑았습니다.',
        bannerImageUrl: null,
        startsAt: kstAt(-1, 10),
        endsAt: kstAt(-1, 12),
        status: 'drawn',
        isTimeRaffle: true,
        raffleDetail: raffleDetail(
            '무너 컬렉터 패키지를 등수별로 나눠 드립니다. 1등 메탈릭 피규어, 2등 아크릴 키링 세트, 3등 굿즈 박스 구성입니다.',
            '1등 무너 메탈릭 피규어 · 2등 무너 아크릴 키링 세트 · 3등 무너 굿즈 박스',
        ),
        requiredTickets: 2,
        tags: ['한정 굿즈'],
        prizeName: '무너 메탈릭 피규어',
        winnerCount: 56,
        participantCount: 4820,
        usedTicketCount: 9640,
        myEntryCount: 0,
        myTicketCount: 0,
    },
    {
        id: 'evt-108',
        title: '다이슨 에어랩',
        description:
            '고온으로 인한 열 손상을 줄이면서 말리고 마는 멀티 스타일러입니다. 전용 케이스에 헤드를 정리해 두고 쓸 수 있습니다.',
        bannerImageUrl: null,
        startsAt: kstAt(-1, 15),
        endsAt: kstAt(-1, 16),
        status: 'closed',
        isTimeRaffle: true,
        raffleDetail: raffleDetail(
            '열 손상을 줄이며 스타일링할 수 있는 멀티 스타일러입니다. 전용 케이스를 함께 드렸습니다.',
            '다이슨 에어랩 멀티 스타일러 + 전용 케이스',
        ),
        requiredTickets: 3,
        tags: ['한정 굿즈'],
        prizeName: '다이슨 에어랩',
        winnerCount: 1,
        participantCount: 4120,
        usedTicketCount: 9840,
        myEntryCount: 2,
        myTicketCount: 6,
    },
    {
        id: 'evt-109',
        title: '소니 WH-1000XM6',
        description:
            '장거리 이동에서도 주변 소음을 눌러 주는 헤드폰입니다. 하드 케이스와 항공 어댑터가 들어 있어 기내에서도 그대로 연결됩니다.',
        bannerImageUrl: null,
        startsAt: kstAt(-1, 17),
        endsAt: kstAt(-1, 18),
        status: 'drawn',
        isTimeRaffle: true,
        raffleDetail: raffleDetail(
            '업계 최고 수준의 노이즈 캔슬링 헤드폰입니다. 장거리 이동에 쓸 수 있는 항공 어댑터를 함께 드렸습니다.',
            '소니 WH-1000XM6 본체 + 하드 케이스 + 항공 어댑터',
        ),
        requiredTickets: 2,
        tags: ['디지털기기'],
        prizeName: '소니 WH-1000XM6',
        winnerCount: 2,
        participantCount: 2280,
        usedTicketCount: 5060,
        myEntryCount: 0,
        myTicketCount: 0,
    },
    {
        id: 'evt-110',
        title: '무너 한정 담요',
        description:
            '겨울 시즌에만 제작한 무너 극세사 담요입니다. 보관 파우치에 접어 넣으면 부피가 줄어 차 안이나 캠핑장에서도 쓰기 좋습니다.',
        bannerImageUrl: null,
        startsAt: kstAt(-1, 19),
        endsAt: kstAt(-1, 20),
        status: 'drawn',
        isTimeRaffle: true,
        raffleDetail: raffleDetail(
            '겨울 시즌 한정으로 제작한 무너 극세사 담요입니다. 보관 파우치가 함께 들어갑니다.',
            '무너 극세사 담요 1종 + 보관 파우치',
        ),
        requiredTickets: 1,
        tags: ['한정 굿즈'],
        prizeName: '무너 한정 담요',
        winnerCount: 40,
        participantCount: 3610,
        usedTicketCount: 4220,
        myEntryCount: 1,
        myTicketCount: 1,
    },
    {
        id: 'evt-111',
        title: '스타벅스 럭키백',
        description:
            '텀블러와 드립백 원두, 리유저블 컵을 함께 담은 구성입니다. 집과 사무실에 하나씩 두고 번갈아 쓸 수 있게 컵을 두 종류로 넣었습니다.',
        bannerImageUrl: null,
        startsAt: kstAt(-1, 21),
        endsAt: kstAt(-1, 22),
        status: 'drawn',
        isTimeRaffle: true,
        raffleDetail: raffleDetail(
            '텀블러와 원두를 함께 담은 럭키백입니다. 리유저블 컵이 함께 들어갑니다.',
            '스타벅스 텀블러 + 드립백 원두 세트 + 리유저블 컵',
        ),
        requiredTickets: 1,
        tags: ['한정 굿즈'],
        prizeName: '스타벅스 럭키백',
        winnerCount: 25,
        participantCount: 1980,
        usedTicketCount: 2340,
        myEntryCount: 0,
        myTicketCount: 0,
    },

    // ── 시연 플로우용 ── 응모 → 마감 → 발표 대기 → 발표 완료를 몇 분 안에 한 번 돌려보기 위한 래플
    {
        id: 'evt-112',
        title: '무너 시그니처 머그 타임 래플',
        description:
            '무너 얼굴을 입체로 올린 도자기 머그입니다. 손잡이 안쪽까지 유약을 입혀 설거지 후에도 물이 고이지 않습니다.',
        bannerImageUrl: null,
        startsAt: FLOW_STARTS_AT,
        endsAt: FLOW_ENDS_AT,
        status: 'open',
        isTimeRaffle: true,
        raffleDetail: raffleDetail(
            '무너 시그니처 머그는 타임래플 전용으로 소량 제작한 도자기 머그입니다. 전자레인지와 식기세척기를 모두 쓸 수 있습니다.',
            '무너 시그니처 머그 1종 + 전용 코스터',
        ),
        requiredTickets: 1,
        tags: ['한정 굿즈'],
        prizeName: '무너 시그니처 머그',
        winnerCount: 10,
        participantCount: 412,
        usedTicketCount: 530,
        myEntryCount: 0,
        myTicketCount: 0,
    },
];

/** 응모 목업이 한도·잔액을 검사하기 전에 대상 이벤트를 찾을 때 쓴다 */
export function findMockEvent(eventId: string) {
    return mockEvents.find((e) => e.id === eventId) ?? null;
}

/**
 * 응모 목업이 접수를 확정한 뒤 호출한다 — 내 응모 기록과 실시간 현황 지표를 함께 올린다.
 * 서버가 보관할 상태를 목업에서 흉내 내는 것이라 응모 핸들러가 아니라 이벤트 데이터 옆에 둔다.
 */
export function recordMockEventEntry(
    event: NonNullable<ReturnType<typeof findMockEvent>>,
    ticketCount: number,
) {
    // 같은 사람이 여러 번 응모해도 응모자 수는 한 번만 는다
    if ((event.myEntryCount ?? 0) === 0) {
        event.participantCount = (event.participantCount ?? 0) + 1;
    }
    event.myEntryCount = (event.myEntryCount ?? 0) + 1;
    event.myTicketCount = (event.myTicketCount ?? 0) + ticketCount;
    event.usedTicketCount = (event.usedTicketCount ?? 0) + ticketCount;
}

/** E03 응모 통계 — 목업의 시드·접수 카운터를 EntryStatistics 모양으로 바꾼다 */
export function getMockEventStatistics(event: NonNullable<ReturnType<typeof findMockEvent>>) {
    return {
        eventId: event.id,
        participantCount: event.participantCount ?? 0,
        totalSpentTicketCount: event.usedTicketCount ?? 0,
        mySpentTicketCount: event.myTicketCount ?? 0,
        serverTime: mockNow().toISOString(),
    };
}

/** ADR-009 — 유형과 무관하게 마감 + 5분 검토 후 자동으로 최초 발표한다 */
export const ANNOUNCE_DELAY_MS = 5 * 60 * 1000;

/**
 * 응답 시점의 이벤트 상태.
 *
 * 목 데이터에 적어 둔 status는 작성 당시의 값이라 시간이 지나면 기간과 어긋난다
 * (마감일이 지났는데 계속 진행 중으로 남는 식). 서버가 할 일이므로 응답을 만들 때 다시 계산해
 * 진행 예정 → 진행 중 → 마감(발표 대기) → 발표 완료가 실제로 이어지게 한다.
 */
function statusAt(startsAt: string, endsAt: string, now: number): EventStatus {
    const starts = new Date(startsAt).getTime();
    const ends = new Date(endsAt).getTime();

    if (now < starts) return 'upcoming';
    if (now < ends) return 'open';
    // 마감 후 발표까지는 '발표 대기' 구간이다 (ADR-009 — 마감 + 5분 자동 발표)
    if (now < ends + ANNOUNCE_DELAY_MS) return 'closed';
    return 'drawn';
}

/**
 * 목 이벤트를 응답 모양으로 바꾼다 — 상태를 지금 기준으로 다시 계산하고 발표 예정 시각을 싣는다.
 * 발표 카운트다운은 서버가 준 시각으로 계산해야 새로고침에 리셋되지 않으므로(docs/CONTEXT.md),
 * 화면에서 마감 + 5분을 더하지 않도록 목업이 서버 몫을 대신 계산한다.
 */
function toResponse<
    T extends {
        startsAt: string;
        endsAt: string;
        participantCount: number | null;
        usedTicketCount: number | null;
    },
>(event: T, now: number) {
    // 응모 현황은 E03 전용이므로 이벤트 응답에서 뺀다
    const { participantCount, usedTicketCount, ...rest } = event;
    void participantCount;
    void usedTicketCount;
    const ends = new Date(event.endsAt).getTime();
    return {
        ...rest,
        status: statusAt(event.startsAt, event.endsAt, now),
        publicationScheduledAt: new Date(ends + ANNOUNCE_DELAY_MS).toISOString(),
    };
}

export const eventHandlers = [
    // E01 초안 — Page 봉투 + status 필터. 목업 항목은 시연 표시용 필드(참여자 수·내 응모 등)를 더 싣는다
    http.get(api('/events'), ({ request }) => {
        const url = new URL(request.url);
        const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
        const size = Math.max(1, Number(url.searchParams.get('size')) || 20);
        const status = url.searchParams.get('status');
        const now = mockNow().getTime();
        const items = mockEvents
            .map((event) => toResponse(event, now))
            .filter((event) => !status || event.status === status);
        return ok({
            items: items.slice((page - 1) * size, page * size),
            page,
            size,
            totalElements: items.length,
        });
    }),
    http.get(api('/events/:eventId'), ({ params }) => {
        const event = mockEvents.find((e) => e.id === params.eventId);
        if (!event) {
            return fail(404, 'RESOURCE_NOT_FOUND', '이벤트를 찾을 수 없습니다');
        }
        return ok(toResponse(event, mockNow().getTime()));
    }),
];
