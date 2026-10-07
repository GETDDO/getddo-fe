import { http } from 'msw';

import type { TicketHistory } from '@entities/ticket';

import { env } from '@shared/config/env';
import { kstNextMonthStart, toKst } from '@shared/lib/date';

import { mockNow } from '../now';
import { ok } from './response';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const kstMonthStart = (date: Date) => {
    const k = new Date(date.getTime() + KST_OFFSET_MS);
    return new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), 1) - KST_OFFSET_MS);
};
const kstMonth = (date: Date) => toKst(date).toISOString().slice(0, 7);

// spec T01 — TicketWallet. 월 지급분은 다음 달 1일 00:00 KST에 만료하는 지갑 단위로 잔액을 나눈다 (getddo-spec ticket.md)
interface MockWallet {
    id: string;
    expiryMonth: string;
    validFrom: string;
    expiresAt: string;
    balance: number;
}

// 시연용 초기 이력 — walletId·balanceAfter는 seedState()가 지갑 잔액에 맞춰 채운다
const seedLedger: Array<Omit<TicketHistory, 'walletId' | 'balanceAfter'>> = [
    {
        id: 'th-1',
        transactionType: 'GRANT',
        quantity: 1,
        reason: '출석 체크',
        createdAt: '2026-09-17T01:00:00Z',
    },
    {
        id: 'th-2',
        transactionType: 'SPEND',
        quantity: -1,
        reason: '이벤트 응모',
        createdAt: '2026-09-16T09:30:00Z',
    },
    {
        id: 'th-15',
        transactionType: 'REFUND',
        quantity: 2,
        reason: '이벤트 취소 응모권 반환',
        createdAt: '2026-09-16T05:00:00Z',
    },
    {
        id: 'th-16',
        transactionType: 'REVOKE',
        quantity: -1,
        reason: '부정 획득 응모권 회수',
        createdAt: '2026-09-15T07:00:00Z',
    },
    {
        id: 'th-3',
        transactionType: 'GRANT',
        quantity: 1,
        reason: '매일 출석체크 리워드',
        createdAt: '2026-09-15T00:30:00Z',
    },
    {
        id: 'th-4',
        transactionType: 'SPEND',
        quantity: -3,
        reason: '닌텐도 스위치 2 래플 응모',
        createdAt: '2026-09-14T11:20:00Z',
    },
    {
        id: 'th-5',
        transactionType: 'GRANT',
        quantity: 1,
        reason: '공룡 달리기 게임 보상',
        createdAt: '2026-09-14T08:10:00Z',
    },
    {
        id: 'th-6',
        transactionType: 'GRANT',
        quantity: 2,
        reason: '5G 브랜드 퀴즈 정답',
        createdAt: '2026-09-13T05:45:00Z',
    },
    {
        id: 'th-7',
        transactionType: 'GRANT',
        quantity: 1,
        reason: '매일 출석체크 리워드',
        createdAt: '2026-09-13T00:05:00Z',
    },
    {
        id: 'th-8',
        transactionType: 'SPEND',
        quantity: -2,
        reason: '스타벅스 e카드 래플 응모',
        createdAt: '2026-09-12T13:00:00Z',
    },
    {
        id: 'th-9',
        transactionType: 'GRANT',
        quantity: 1,
        reason: '알림 수신 동의 설문',
        createdAt: '2026-09-11T02:40:00Z',
    },
    {
        id: 'th-10',
        transactionType: 'GRANT',
        quantity: 1,
        reason: '룰렛 돌리기 게임 보상',
        createdAt: '2026-09-10T09:15:00Z',
    },
    {
        id: 'th-11',
        transactionType: 'GRANT',
        quantity: 1,
        reason: '7일 연속 출석 보너스',
        createdAt: '2026-09-07T00:10:00Z',
    },
    {
        id: 'th-12',
        transactionType: 'SPEND',
        quantity: -1,
        reason: 'VVIP 데이터 쿠폰 래플 응모',
        createdAt: '2026-09-05T10:30:00Z',
    },
    {
        id: 'th-13',
        transactionType: 'GRANT',
        quantity: 1,
        reason: '매일 출석체크 리워드',
        createdAt: '2026-09-02T00:20:00Z',
    },
    {
        // 9월 1일 00:00 KST — 8월분 지급 응모권의 월 경계 만료
        id: 'th-17',
        transactionType: 'EXPIRE',
        quantity: -2,
        reason: '응모권 월 만료',
        createdAt: '2026-08-31T15:00:00Z',
    },
    {
        id: 'th-14',
        transactionType: 'GRANT',
        quantity: 1,
        reason: '매일 출석체크 리워드',
        createdAt: '2026-08-31T00:15:00Z',
    },
];

// 8월분 이력(EXPIRE)은 이미 만료된 지갑에, 나머지는 다음 달 만료 지갑에 붙인다
const EXPIRED_WALLET_ID = 'wallet-expired-08';
const walletIdOfSeed = (id: string) => (id === 'th-17' ? EXPIRED_WALLET_ID : 'wallet-next');

// 목업 세션 동안 유지되는 응모권 상태 — X-User-ID별로 분리한다.
// 한 사용자의 출석 보상·응모 차감이 다른 사용자의 잔액·이력에 섞이지 않게 한다
interface TicketState {
    wallets: MockWallet[];
    history: TicketHistory[];
}

const stateByUser = new Map<string, TicketState>();

const userIdOf = (request: Request) => request.headers.get('X-User-ID') ?? 'anonymous';

// balanceAfter는 지갑별 처리 직후 잔액이다 — 시드 이력을 시간순으로 적용해 지갑 현재 잔액에서 거슬러 계산한다
function buildSeedHistory(wallets: MockWallet[]): TicketHistory[] {
    const openingByWallet = new Map<string, number>();
    for (const wallet of wallets) {
        const sum = seedLedger
            .filter((item) => walletIdOfSeed(item.id) === wallet.id)
            .reduce((acc, item) => acc + item.quantity, 0);
        openingByWallet.set(wallet.id, wallet.balance - sum);
    }

    return [...seedLedger]
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((item) => {
            const walletId = walletIdOfSeed(item.id);
            const balanceAfter = (openingByWallet.get(walletId) ?? 0) + item.quantity;
            openingByWallet.set(walletId, balanceAfter);
            return { ...item, walletId, balanceAfter };
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

const seedState = (): TicketState => {
    const now = mockNow();
    const nextMonthStart = kstNextMonthStart(now);
    const wallets: MockWallet[] = [
        {
            // 당월 지급분 — 다음 달 1일에 만료해 "이번 달 만료 예정" 안내를 띄운다
            id: 'wallet-current',
            expiryMonth: kstMonth(now),
            validFrom: kstMonthStart(now).toISOString(),
            expiresAt: nextMonthStart.toISOString(),
            balance: 2,
        },
        {
            // 익월 지급분 — 지난 이력 대부분이 모인 지갑
            id: 'wallet-next',
            expiryMonth: kstMonth(nextMonthStart),
            validFrom: nextMonthStart.toISOString(),
            expiresAt: kstNextMonthStart(nextMonthStart).toISOString(),
            balance: 8,
        },
        {
            id: EXPIRED_WALLET_ID,
            expiryMonth: '2026-08',
            validFrom: '2026-07-31T15:00:00Z',
            expiresAt: '2026-08-31T15:00:00Z',
            balance: 0,
        },
    ];
    return { wallets, history: buildSeedHistory(wallets) };
};

const stateFor = (userId: string): TicketState => {
    let state = stateByUser.get(userId);
    if (!state) {
        state = seedState();
        stateByUser.set(userId, state);
    }
    return state;
};

const isActive = (wallet: MockWallet, now: number) => new Date(wallet.expiresAt).getTime() > now;

const availableBalanceOf = (state: TicketState, now: number) =>
    state.wallets.reduce((sum, w) => (isActive(w, now) ? sum + w.balance : sum), 0);

/** 응모 목업이 차감 전에 잔액을 확인할 때 쓴다 — 활성 지갑 합계 */
export function getMockTicketBalance(userId: string) {
    return availableBalanceOf(stateFor(userId), mockNow().getTime());
}

/** 활성 지갑이 없을 때 지급·반환을 받기 위해 새로 따는 당월 지갑 — expiresAt은 다음 달 1일 KST */
const mintCurrentMonthWallet = (): MockWallet => {
    const now = mockNow();
    return {
        id: `wallet-${crypto.randomUUID()}`,
        expiryMonth: kstMonth(now),
        validFrom: kstMonthStart(now).toISOString(),
        expiresAt: kstNextMonthStart(now).toISOString(),
        balance: 0,
    };
};

/**
 * 지갑 잔액을 반영하고 반영한 지갑을 돌려준다.
 * 지급·반환은 당월 지갑에, 차감은 만료가 빠른 지갑부터 나간다 (getddo-spec ticket.md 월 만료 정책)
 */
function applyWalletDelta(state: TicketState, amount: number): MockWallet {
    const now = mockNow().getTime();
    const active = state.wallets
        .filter((w) => isActive(w, now))
        .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
    const target = active[0];
    if (!target) {
        // 활성 지갑이 하나도 없으면(전부 만료) 이번 달 지갑을 새로 따서 지급·반환을 받는다
        const fresh = mintCurrentMonthWallet();
        state.wallets.push(fresh);
        if (amount > 0) fresh.balance = amount;
        return fresh;
    }
    if (amount >= 0) {
        target.balance += amount;
        return target;
    }
    let rest = -amount;
    let last = target;
    for (const wallet of active) {
        const take = Math.min(wallet.balance, rest);
        wallet.balance -= take;
        rest -= take;
        last = wallet;
        if (rest === 0) break;
    }
    return last;
}

/** 다른 목업 핸들러(출석·게임 등)에서 응모권 지급·차감을 기록할 때 쓴다 */
export function recordMockTicketGrant(userId: string, amount: number, reason: string) {
    const state = stateFor(userId);
    const wallet = applyWalletDelta(state, amount);
    state.history.unshift({
        id: `th-mock-${crypto.randomUUID()}`,
        walletId: wallet.id,
        transactionType: amount >= 0 ? 'GRANT' : 'SPEND',
        quantity: amount,
        balanceAfter: wallet.balance,
        reason,
        createdAt: mockNow().toISOString(),
    });
}

/** 관리자 취소·자동 취소로 차감된 응모권을 되돌려줄 때 쓴다 — 지급(GRANT)이 아닌 반환(REFUND) 이력으로 남긴다 */
export function recordMockTicketRefund(userId: string, amount: number, reason: string) {
    const state = stateFor(userId);
    const wallet = applyWalletDelta(state, amount);
    state.history.unshift({
        id: `th-mock-${crypto.randomUUID()}`,
        walletId: wallet.id,
        transactionType: 'REFUND',
        quantity: amount,
        balanceAfter: wallet.balance,
        reason,
        createdAt: mockNow().toISOString(),
    });
}

export const ticketHandlers = [
    // T01 초안 — MyWallets{availableBalance, wallets, serverTime}
    http.get(api('/tickets/wallets/me'), ({ request }) => {
        const now = mockNow().getTime();
        const state = stateFor(userIdOf(request));
        return ok({
            availableBalance: availableBalanceOf(state, now),
            wallets: state.wallets.map((w) => ({
                ...w,
                status: isActive(w, now) ? 'ACTIVE' : 'EXPIRED',
            })),
            serverTime: mockNow().toISOString(),
        });
    }),
    // T02 초안 — Cursor<TicketTransaction>. cursor는 마지막으로 받은 항목의 id다
    http.get(api('/tickets/ledger/me'), ({ request }) => {
        const url = new URL(request.url);
        const size = Math.min(100, Math.max(1, Number(url.searchParams.get('size')) || 20));
        const cursor = url.searchParams.get('cursor');
        const transactionType = url.searchParams.get('transactionType');
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');

        const filtered = stateFor(userIdOf(request)).history.filter((item) => {
            if (transactionType && item.transactionType !== transactionType) return false;
            if (from && item.createdAt < from) return false;
            if (to && item.createdAt >= to) return false;
            return true;
        });
        const start = cursor ? filtered.findIndex((item) => item.id === cursor) + 1 : 0;
        const items = filtered.slice(start, start + size);
        return ok({
            items,
            nextCursor:
                items.length > 0 && start + size < filtered.length
                    ? (items.at(-1)?.id ?? null)
                    : null,
            totalElements: filtered.length,
        });
    }),
];
