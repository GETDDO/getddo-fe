import { http } from 'msw';

import type {
    CancellationSummary,
    DrawCandidate,
    DrawResult,
    DrawRun,
    DrawRunDetail,
    DrawVerification,
} from '@entities/drawResult';
import type { PublicationUpdateResult, PublicListChange } from '@entities/winner';

import { env } from '@shared/config/env';
import { IDEMPOTENCY_HEADER } from '@shared/lib/idempotencyKey';

import { mockNow } from '../now';
import { mockEvents } from './event';
import { fail, ok } from './response';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

/*
 * 추첨 관리 목업 — getddo-spec 05-api/drawing.md AD01~AD09 (검토 대기 초안).
 *
 * 이벤트별 추첨 상태(store)를 처음 조회할 때 만들고, 시연 루프
 * 응모 → 최초 추첨(확정) → 발표 → 당첨 취소 → 재추첨 → 공개 명단 반영 → 변경 이력을 끝까지 돌린다.
 * 재추첨 실행은 서버가 비동기로 선정하는 것처럼 시간이 지나며 PREPARING → RUNNING → CONFIRMED로 진행한다.
 */

const MINUTE = 60 * 1000;
/** ADR-009 — 마감 + 5분에 최초 발표한다 */
const ANNOUNCE_DELAY_MS = 5 * MINUTE;
/** 이벤트당 후보 명단 규모 */
const CANDIDATE_COUNT = 33;
/** 재추첨 실행이 준비 → 선정 → 확정으로 넘어가는 경과 시간 (실제 시계 기준, 가상 시계와 무관) */
const PREPARING_MS = 1500;
const CONFIRM_MS = 4500;
/** 한 이벤트에서 목업이 만드는 슬롯 상한 — 당첨 인원이 큰 시드도 화면에 다 담기게 한다 */
const SLOT_LIMIT = 50;
const GRADE_WEIGHT = { bronze: 1, silver: 3, gold: 5 } as const;
const DEFAULT_ACTOR = 'vu-admin';

interface MockPrize {
    id: string;
    rank: number;
    winnerCount: number;
}

/** 관리자 목업(adminEvent.ts)에만 있는 시드 이벤트 — 시연용 운영 상태를 추첨 쪽에서도 재현한다 */
const EXTRA_EVENTS: Record<
    string,
    { endsAtOffsetMin: number; prizes: MockPrize[]; canceled?: boolean }
> = {
    // 취소된 이벤트 — AD06·AD05의 이벤트 취소 409 시연용
    'adm-902': {
        endsAtOffsetMin: -24 * 60,
        canceled: true,
        prizes: [{ id: 'adm-902-p1', rank: 1, winnerCount: 30 }],
    },
    // 재추첨이 실패해 재개를 기다리는 이벤트
    'adm-904': { endsAtOffsetMin: -30, prizes: [{ id: 'adm-904-p1', rank: 1, winnerCount: 1 }] },
    // 추첨은 확정됐지만 최초 발표 전인 이벤트 — 최초 공개 전 재추첨 확인(정책 미확정) 시연용
    'adm-905': { endsAtOffsetMin: -20, prizes: [{ id: 'adm-905-p1', rank: 1, winnerCount: 3 }] },
};
const HELD_BEFORE_PUBLICATION = new Set(['adm-905']);

interface MockRun {
    detail: DrawRunDetail;
    /** AD03 후보 스냅샷의 candidate id — 실행 생성 시점에 고정한다 */
    candidateIds: string[];
    /** 비동기 진행의 기준 시각(Date.now) — null이면 진행하지 않는다 */
    progressFrom: number | null;
    /** 재추첨이 채울 빈 슬롯 */
    vacancy: { prizeId: string; prizeRank: number; slotNumber: number } | null;
    appliedPublication: PublicationUpdateResult | null;
}

interface StoredCancellation {
    key: string;
    winId: string;
    reason: string;
    cancellationId: string;
    canceledAt: string;
    runId: string;
}

interface DrawStore {
    eventId: string;
    prizes: MockPrize[];
    candidates: DrawCandidate[];
    runs: MockRun[];
    canceled: boolean;
    firstPublished: boolean;
    /** `${prizeId}:${slotNumber}` → 공개 명단의 사용자 */
    publicList: Map<string, string | null>;
    revision: number;
    changes: PublicListChange[];
    verifications: DrawVerification[];
    cancellations: StoredCancellation[];
}

const stores = new Map<string, DrawStore>();

/* ── 결정적 난수 — 같은 이벤트·실행은 항상 같은 결과를 낸다 ── */

function hashString(value: string): number {
    let h = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
        h ^= value.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function seededRandom(seed: string): () => number {
    let a = hashString(seed);
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function pickWeighted(pool: DrawCandidate[], random: () => number): DrawCandidate {
    const total = pool.reduce((sum, c) => sum + c.weight, 0);
    let cursor = random() * total;
    for (const candidate of pool) {
        cursor -= candidate.weight;
        if (cursor < 0) return candidate;
    }
    return pool[pool.length - 1]!;
}

/* ── 식별자 — 경로에서 이벤트를 되찾을 수 있게 이벤트 ID를 포함한다 ── */

const runIdOf = (eventId: string, runNumber: number) => `drw-${eventId}-r${runNumber}`;
const resultIdOf = (eventId: string, runNumber: number, slotNumber: number) =>
    `drr-${eventId}-r${runNumber}-s${slotNumber}`;
const cancellationIdOf = (eventId: string, seq: number) => `can-${eventId}-${seq}`;

const eventIdFromId = (id: string, prefix: 'drw' | 'drr' | 'can') => {
    const match = new RegExp(`^${prefix}-(.+?)-(?:r\\d+|\\d+)(?:-s\\d+)?$`).exec(id);
    return match?.[1] ?? null;
};

/* ── 시드 ── */

function buildCandidates(eventId: string): DrawCandidate[] {
    const random = seededRandom(`${eventId}:candidates`);
    return Array.from({ length: CANDIDATE_COUNT }, (_, index) => {
        const seq = String(index + 1).padStart(3, '0');
        // 실제 차감 장수(등급별)와 가중치를 구분해 보여주기 위해 등급을 섞는다
        const bronze = Math.floor(random() * 3);
        const silver = Math.floor(random() * 2);
        const gold = random() < 0.2 ? 1 : 0;
        const ticketCount = Math.max(1, bronze + silver + gold);
        const weight =
            bronze * GRADE_WEIGHT.bronze + silver * GRADE_WEIGHT.silver + gold * GRADE_WEIGHT.gold;
        return {
            id: `cand-${eventId}-${seq}`,
            participantId: `part-${eventId}-${seq}`,
            userId: `user-${seq}`,
            ticketCount,
            weight: Math.max(1, weight),
            entrySnapshot: { bronze, silver, gold },
            eligibilitySnapshot: {
                eligible: true,
                membership: index % 3 === 0 ? 'vip' : 'excellent',
            },
        };
    });
}

function eventInfoOf(
    eventId: string,
): { endsAt: string; prizes: MockPrize[]; canceled: boolean } | null {
    const extra = EXTRA_EVENTS[eventId];
    if (extra) {
        return {
            endsAt: new Date(mockNow().getTime() + extra.endsAtOffsetMin * MINUTE).toISOString(),
            prizes: extra.prizes,
            canceled: extra.canceled ?? false,
        };
    }
    const event = mockEvents.find((e) => e.id === eventId);
    if (!event) return null;
    return {
        endsAt: event.endsAt,
        prizes: [{ id: `${event.id}-prize-1`, rank: 1, winnerCount: event.winnerCount }],
        canceled: false,
    };
}

const isPublishedByClock = (eventId: string, endsAt: string, now: number) =>
    !HELD_BEFORE_PUBLICATION.has(eventId) && now >= new Date(endsAt).getTime() + ANNOUNCE_DELAY_MS;

const slotKey = (prizeId: string, slotNumber: number) => `${prizeId}:${slotNumber}`;

function drawFirstRun(store: DrawStore, endsAt: string): MockRun {
    const random = seededRandom(`${store.eventId}:1`);
    const pool = [...store.candidates];
    const results: DrawResult[] = [];
    let order = 0;

    for (const prize of [...store.prizes].sort((a, b) => a.rank - b.rank)) {
        const slots = Math.min(prize.winnerCount, SLOT_LIMIT);
        for (let slot = 1; slot <= slots; slot += 1) {
            const winner = pool.length > 0 ? pickWeighted(pool, random) : null;
            if (winner) pool.splice(pool.indexOf(winner), 1);
            if (winner) order += 1;
            results.push({
                id: resultIdOf(store.eventId, 1, results.length + 1),
                prizeId: prize.id,
                prizeRank: prize.rank,
                slotNumber: slot,
                selectionOrder: winner ? order : null,
                // 후보가 모자라면 채우지 못한 슬롯을 미충원으로 확정한다
                resultType: winner ? 'SELECTED' : 'UNFILLED',
                candidateId: winner?.id ?? null,
                userId: winner?.userId ?? null,
                wasPublished: false,
                isCanceled: false,
            });
        }
    }

    const confirmedAt = new Date(endsAt).toISOString();
    return {
        detail: {
            id: runIdOf(store.eventId, 1),
            eventId: store.eventId,
            runNumber: 1,
            executionType: 'AUTO',
            status: 'CONFIRMED',
            originalDrawId: null,
            startedAt: confirmedAt,
            confirmedAt,
            createdAt: confirmedAt,
            algorithmVersion: 'weighted-draw-v1',
            rulesSnapshot: {
                weighting: 'bronze1-silver3-gold5',
                candidateCount: store.candidates.length,
            },
            snapshotFixedAt: confirmedAt,
            cancellations: [],
            results,
            failureCount: 0,
            lastFailureCode: null,
            lastFailureMessage: null,
            lastFailedAt: null,
            lastFailureTraceId: null,
        },
        candidateIds: store.candidates.map((c) => c.id),
        progressFrom: null,
        vacancy: null,
        appliedPublication: null,
    };
}

/** 이 이벤트의 현재 명단 — 슬롯별로 취소되지 않은 가장 최근 확정 선정 결과 */
function effectiveList(store: DrawStore, upToRun = Number.POSITIVE_INFINITY) {
    const list = new Map<string, string | null>();
    for (const run of store.runs) {
        if (run.detail.status !== 'CONFIRMED' || run.detail.runNumber > upToRun) continue;
        for (const result of run.detail.results) {
            const key = slotKey(result.prizeId, result.slotNumber);
            if (result.resultType === 'UNFILLED') {
                if (!list.has(key)) list.set(key, null);
            } else {
                list.set(key, result.isCanceled ? null : result.userId);
            }
        }
    }
    return list;
}

function markFirstPublication(store: DrawStore) {
    store.firstPublished = true;
    store.revision = 1;
    // 최초 공개 전에 확정된 재추첨 결과도 관리자 확인을 거쳤다면 최초 명단에 함께 실린다
    for (const run of store.runs) {
        if (run.detail.status !== 'CONFIRMED') continue;
        for (const result of run.detail.results) {
            if (result.resultType === 'SELECTED') result.wasPublished = true;
        }
    }
    store.publicList = effectiveList(store);
}

function createRedrawRun(
    store: DrawStore,
    canceled: { result: DrawResult; runId: string },
    reason: string,
    actor: string,
    canceledAt: string,
): { run: MockRun; cancellation: StoredCancellation['cancellationId'] } {
    const runNumber = store.runs.length + 1;
    const cancellationId = cancellationIdOf(store.eventId, store.cancellations.length + 1);
    const used = new Set<string>();
    for (const run of store.runs) {
        for (const result of run.detail.results) {
            if (result.userId) used.add(result.userId);
        }
    }
    // 재추첨 후보는 최초 후보 정보를 재사용하되 기존 당첨자·취소자를 제거한다
    const candidateIds = store.candidates.filter((c) => !used.has(c.userId)).map((c) => c.id);
    const cancellation: CancellationSummary = {
        id: cancellationId,
        canceledDrawResultId: canceled.result.id,
        canceledDrawRunId: canceled.runId,
        canceledBy: actor,
        reason,
        canceledAt,
    };
    const run: MockRun = {
        detail: {
            id: runIdOf(store.eventId, runNumber),
            eventId: store.eventId,
            runNumber,
            executionType: 'MANUAL',
            status: 'PREPARING',
            originalDrawId: runIdOf(store.eventId, 1),
            startedAt: null,
            confirmedAt: null,
            createdAt: canceledAt,
            algorithmVersion: 'weighted-draw-v1',
            rulesSnapshot: { weighting: 'bronze1-silver3-gold5', fillVacanciesOnly: true },
            snapshotFixedAt: canceledAt,
            cancellations: [cancellation],
            results: [],
            failureCount: 0,
            lastFailureCode: null,
            lastFailureMessage: null,
            lastFailedAt: null,
            lastFailureTraceId: null,
        },
        candidateIds,
        progressFrom: Date.now(),
        vacancy: {
            prizeId: canceled.result.prizeId,
            prizeRank: canceled.result.prizeRank,
            slotNumber: canceled.result.slotNumber,
        },
        appliedPublication: null,
    };
    store.runs.push(run);
    return { run, cancellation: cancellationId };
}

function seedFailedRedraw(store: DrawStore) {
    const first = store.runs[0]!;
    const target = first.detail.results.find((r) => r.resultType === 'SELECTED');
    if (!target) return;
    target.isCanceled = true;
    const canceledAt = new Date(mockNow().getTime() - 10 * MINUTE).toISOString();
    const { run } = createRedrawRun(
        store,
        { result: target, runId: first.detail.id },
        '당첨자 본인 확인 실패',
        'vu-admin',
        canceledAt,
    );
    store.cancellations.push({
        key: `seed-${store.eventId}`,
        winId: target.id,
        reason: '당첨자 본인 확인 실패',
        cancellationId: run.detail.cancellations[0]!.id,
        canceledAt,
        runId: run.detail.id,
    });
    run.progressFrom = null;
    run.detail.status = 'FAILED';
    run.detail.startedAt = canceledAt;
    run.detail.failureCount = 2;
    run.detail.lastFailureCode = 'DRAW-SELECTION-TIMEOUT';
    run.detail.lastFailureMessage =
        '추첨 선정 중 일시적인 오류가 발생했습니다. 같은 실행을 재개할 수 있습니다.';
    run.detail.lastFailedAt = new Date(mockNow().getTime() - 8 * MINUTE).toISOString();
    run.detail.lastFailureTraceId = 'trace-0199-demo-draw-failure';
}

function getStore(eventId: string): DrawStore | null {
    const now = mockNow().getTime();
    const existing = stores.get(eventId);
    if (existing) {
        advanceStore(existing, now);
        return existing;
    }
    const info = eventInfoOf(eventId);
    if (!info) return null;
    // 마감 전에는 추첨 실행이 없다 — 스토어를 만들지 않고 빈 목록으로 응답한다
    if (now < new Date(info.endsAt).getTime()) return null;

    const store: DrawStore = {
        eventId,
        prizes: info.prizes,
        candidates: buildCandidates(eventId),
        runs: [],
        canceled: info.canceled,
        firstPublished: false,
        publicList: new Map(),
        revision: 0,
        changes: [],
        verifications: [],
        cancellations: [],
    };
    store.runs.push(drawFirstRun(store, info.endsAt));
    if (isPublishedByClock(eventId, info.endsAt, now)) markFirstPublication(store);
    if (eventId === 'adm-904') seedFailedRedraw(store);
    stores.set(eventId, store);
    return store;
}

/** 이벤트 마감 시각 — 발표 시계를 따라가려고 다시 계산한다 */
function advanceStore(store: DrawStore, now: number) {
    const info = eventInfoOf(store.eventId);
    if (info && !store.firstPublished && isPublishedByClock(store.eventId, info.endsAt, now)) {
        markFirstPublication(store);
    }
    for (const run of store.runs) advanceRun(store, run);
}

function advanceRun(store: DrawStore, run: MockRun) {
    if (run.progressFrom === null) return;
    const elapsed = Date.now() - run.progressFrom;
    const { detail } = run;
    if (detail.status === 'PREPARING' && elapsed >= PREPARING_MS) {
        detail.status = 'RUNNING';
        detail.startedAt = mockNow().toISOString();
    }
    if (detail.status === 'RUNNING' && elapsed >= CONFIRM_MS) {
        confirmRun(store, run);
    }
}

/** 빈 슬롯 하나를 후보에서 선정해 확정한다 — 후보가 없으면 미충원으로 확정한다 */
function confirmRun(store: DrawStore, run: MockRun) {
    const { vacancy, detail } = run;
    if (!vacancy) return;
    // 취소자를 포함해 이미 한 번 당첨된 사용자는 다시 뽑지 않는다
    const everSelected = new Set<string>();
    for (const other of store.runs) {
        for (const result of other.detail.results) {
            if (result.userId) everSelected.add(result.userId);
        }
    }
    const pool = store.candidates.filter(
        (c) => run.candidateIds.includes(c.id) && !everSelected.has(c.userId),
    );
    const winner =
        pool.length > 0
            ? pickWeighted(pool, seededRandom(`${store.eventId}:${detail.runNumber}`))
            : null;
    detail.results = [
        {
            id: resultIdOf(store.eventId, detail.runNumber, vacancy.slotNumber),
            prizeId: vacancy.prizeId,
            prizeRank: vacancy.prizeRank,
            slotNumber: vacancy.slotNumber,
            selectionOrder: winner ? 1 : null,
            resultType: winner ? 'SELECTED' : 'UNFILLED',
            candidateId: winner?.id ?? null,
            userId: winner?.userId ?? null,
            wasPublished: false,
            isCanceled: false,
        },
    ];
    detail.status = 'CONFIRMED';
    detail.confirmedAt = mockNow().toISOString();
    run.progressFrom = null;
}

/* ── 응답 직렬화·공통 처리 ── */

function toRun(detail: DrawRunDetail): DrawRun {
    return {
        id: detail.id,
        eventId: detail.eventId,
        runNumber: detail.runNumber,
        executionType: detail.executionType,
        status: detail.status,
        originalDrawId: detail.originalDrawId,
        startedAt: detail.startedAt,
        confirmedAt: detail.confirmedAt,
        createdAt: detail.createdAt,
    };
}

function paginate<T>(items: T[], url: URL) {
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const size = Math.min(100, Math.max(1, Number(url.searchParams.get('size')) || 20));
    return {
        items: items.slice((page - 1) * size, page * size),
        page,
        size,
        totalElements: items.length,
    };
}

const notFound = () => fail(404, 'RESOURCE_NOT_FOUND', '요청한 대상을 찾을 수 없습니다.');
const conflict = (message: string, code = 'STATE_CONFLICT') => fail(409, code, message);
const invalid = (message: string) => fail(400, 'COMMON-002', message);

const actorOf = (request: Request) => request.headers.get('X-User-ID') || DEFAULT_ACTOR;

const readReason = async (request: Request) => {
    const body = (await request.json().catch(() => null)) as { reason?: unknown } | null;
    return typeof body?.reason === 'string' ? body.reason.trim() : '';
};

function findRun(drawId: string) {
    const eventId = eventIdFromId(drawId, 'drw');
    const store = eventId ? getStore(eventId) : null;
    const run = store?.runs.find((r) => r.detail.id === drawId);
    return store && run ? { store, run } : null;
}

function findResult(winId: string) {
    const eventId = eventIdFromId(winId, 'drr');
    const store = eventId ? getStore(eventId) : null;
    if (!store) return null;
    for (const run of store.runs) {
        const result = run.detail.results.find((r) => r.id === winId);
        if (result) return { store, run, result };
    }
    return null;
}

function findCancellation(cancellationId: string) {
    const eventId = eventIdFromId(cancellationId, 'can');
    const store = eventId ? getStore(eventId) : null;
    const run = store?.runs.find((r) =>
        r.detail.cancellations.some((c) => c.id === cancellationId),
    );
    return store && run ? { store, run } : null;
}

const cancellationBody = (stored: StoredCancellation, run: MockRun) => ({
    cancellationId: stored.cancellationId,
    canceledDrawResultId: stored.winId,
    replacementDrawRunId: run.detail.id,
    status: run.detail.status,
    canceledAt: stored.canceledAt,
});

/** 테스트에서 상태를 초기화할 때 쓴다 */
export function resetMockDraws() {
    stores.clear();
}

export const drawHandlers = [
    // AD01 — 이벤트의 추첨 실행 목록 (Page). 마감 전 이벤트는 빈 목록이다
    http.get(api('/admin/events/:eventId/draws'), ({ params, request }) => {
        const eventId = String(params.eventId);
        if (!eventInfoOf(eventId)) return notFound();
        const store = getStore(eventId);
        const runs = store ? [...store.runs].reverse().map((r) => toRun(r.detail)) : [];
        return ok(paginate(runs, new URL(request.url)));
    }),

    // AD02 — 실행 상세 (취소 근거·결과·실패 정보 포함)
    http.get(api('/admin/draws/:drawId'), ({ params }) => {
        const found = findRun(String(params.drawId));
        return found ? ok(found.run.detail) : notFound();
    }),

    // AD03 — 해당 실행이 실제 사용한 후보 명단 (Page)
    http.get(api('/admin/draws/:drawId/participants'), ({ params, request }) => {
        const found = findRun(String(params.drawId));
        if (!found) return notFound();
        const ids = new Set(found.run.candidateIds);
        const candidates = found.store.candidates.filter((c) => ids.has(c.id));
        return ok(paginate(candidates, new URL(request.url)));
    }),

    // AD04 — 정합성 검증. 난수를 다시 돌리지 않고 저장된 결과가 후보·규칙과 맞는지 확인한다
    http.post(api('/admin/draws/:drawId/checks'), ({ params, request }) => {
        const found = findRun(String(params.drawId));
        if (!found) return notFound();
        const { store, run } = found;
        const { detail } = run;
        if (detail.status !== 'CONFIRMED')
            return conflict('확정되지 않은 추첨 실행은 검증할 수 없습니다.');

        const ids = new Set(run.candidateIds);
        const selected = detail.results.filter((r) => r.resultType === 'SELECTED');
        const activeUsers = store.runs
            .flatMap((r) => r.detail.results)
            .filter((r) => r.resultType === 'SELECTED' && !r.isCanceled)
            .map((r) => r.userId);
        const canceledUsers = new Set(
            store.runs
                .flatMap((r) => r.detail.results)
                .filter((r) => r.isCanceled)
                .map((r) => r.userId),
        );
        const expectedSlots =
            detail.runNumber === 1
                ? store.prizes.reduce((sum, p) => sum + Math.min(p.winnerCount, SLOT_LIMIT), 0)
                : detail.cancellations.length;
        const checks = [
            {
                code: 'WINNER_IN_CANDIDATES',
                passed: selected.every((r) => r.candidateId && ids.has(r.candidateId)),
                message: '모든 당첨자가 실행 시점의 후보 명단에 포함돼 있습니다.',
            },
            {
                code: 'NO_DUPLICATE_WINNER',
                passed: new Set(activeUsers).size === activeUsers.length,
                message: '한 사용자가 이벤트에서 두 번 당첨되지 않았습니다.',
            },
            {
                code: 'SLOT_COUNT_MATCH',
                passed: detail.results.length === expectedSlots,
                message: '경품 슬롯 수와 결과 수가 일치합니다.',
            },
            {
                code: 'CANCELED_EXCLUDED',
                passed:
                    detail.runNumber === 1 ||
                    selected.every((r) => !r.userId || !canceledUsers.has(r.userId)),
                message: '당첨 취소자가 재추첨 결과에서 제외됐습니다.',
            },
            {
                code: 'SNAPSHOT_FIXED_BEFORE_CONFIRM',
                passed:
                    Boolean(detail.snapshotFixedAt) &&
                    Boolean(detail.confirmedAt) &&
                    new Date(detail.snapshotFixedAt!).getTime() <=
                        new Date(detail.confirmedAt!).getTime(),
                message: '후보 명단은 확정 이전에 고정됐습니다.',
            },
        ];
        const verification: DrawVerification = {
            id: `chk-${detail.id}-${store.verifications.length + 1}`,
            drawRunId: detail.id,
            passed: checks.every((c) => c.passed),
            checks,
            verifiedAt: mockNow().toISOString(),
            verifiedBy: actorOf(request),
        };
        store.verifications.push(verification);
        return ok(verification, 201);
    }),

    // AD08 — 검증 이력 (Page, 최신순)
    http.get(api('/admin/draws/:drawId/checks'), ({ params, request }) => {
        const found = findRun(String(params.drawId));
        if (!found) return notFound();
        const history = found.store.verifications
            .filter((v) => v.drawRunId === found.run.detail.id)
            .reverse();
        return ok(paginate(history, new URL(request.url)));
    }),

    // AD05 — 당첨 취소 + 재추첨 등록. 같은 키·같은 본문은 200으로 기존 결과를 돌려준다
    http.post(api('/admin/wins/:winId/cancellations'), async ({ params, request }) => {
        const key = request.headers.get(IDEMPOTENCY_HEADER)?.trim();
        if (!key || key.length > 100) return invalid('멱등키는 1~100자로 필요합니다.');
        const reason = await readReason(request);
        if (!reason) return invalid('취소 사유를 입력해야 합니다.');

        const found = findResult(String(params.winId));
        if (!found) return notFound();
        const { store, run, result } = found;

        const replay = store.cancellations.find((c) => c.key === key);
        if (replay) {
            if (replay.winId !== result.id || replay.reason !== reason) {
                return conflict(
                    '같은 멱등키로 다른 요청을 보낼 수 없습니다.',
                    'IDEMPOTENCY_CONFLICT',
                );
            }
            const replacement = store.runs.find((r) => r.detail.id === replay.runId)!;
            return ok(cancellationBody(replay, replacement), 200);
        }

        if (store.canceled) return conflict('취소된 이벤트의 당첨은 취소할 수 없습니다.');
        if (result.isCanceled) return conflict('이미 취소된 당첨입니다.');
        if (result.resultType !== 'SELECTED') return conflict('미충원 결과는 취소할 수 없습니다.');
        if (run.detail.status !== 'CONFIRMED') {
            return conflict('확정되지 않은 추첨 결과는 취소할 수 없습니다.');
        }

        const canceledAt = mockNow().toISOString();
        result.isCanceled = true;
        const { run: replacement } = createRedrawRun(
            store,
            { result, runId: run.detail.id },
            reason,
            actorOf(request),
            canceledAt,
        );
        const stored: StoredCancellation = {
            key,
            winId: result.id,
            reason,
            cancellationId: replacement.detail.cancellations[0]!.id,
            canceledAt,
            runId: replacement.detail.id,
        };
        store.cancellations.push(stored);
        return ok(cancellationBody(stored, replacement), 202);
    }),

    // AD06 — 최초 발표 이후 재추첨 결과를 공개 명단에 반영한다 (최초 공개 전 확인은 후속 계약)
    http.post(api('/admin/draws/:drawId/publication'), async ({ params, request }) => {
        const found = findRun(String(params.drawId));
        if (!found) return notFound();
        const reason = await readReason(request);
        if (!reason) return invalid('반영 사유를 입력해야 합니다.');
        const { store, run } = found;
        const { detail } = run;

        if (detail.runNumber === 1)
            return conflict('재추첨 실행만 공개 명단에 반영할 수 있습니다.');
        if (detail.status !== 'CONFIRMED')
            return conflict('확정되지 않은 실행은 반영할 수 없습니다.');
        if (store.canceled) return conflict('취소된 이벤트는 공개 명단을 갱신할 수 없습니다.');
        if (!store.firstPublished) return conflict('최초 발표 전에는 이 API로 반영할 수 없습니다.');
        // 같은 실행의 재반영은 revision·변경 이력을 새로 만들지 않는다
        if (run.appliedPublication) return ok(run.appliedPublication, 200);

        const next = effectiveList(store, detail.runNumber);
        const changes: PublicListChange['changes'] = [];
        for (const [key, afterUserId] of next) {
            const beforeUserId = store.publicList.get(key) ?? null;
            if (beforeUserId === afterUserId) continue;
            const [prizeId, slot] = key.split(':') as [string, string];
            changes.push({ prizeId, slotNumber: Number(slot), beforeUserId, afterUserId });
        }

        const now = mockNow().toISOString();
        const actor = actorOf(request);
        store.revision += 1;
        const update: PublicationUpdateResult = {
            eventId: store.eventId,
            publicationId: `pub-${store.eventId}-${store.revision}`,
            drawRunId: detail.id,
            revision: store.revision,
            publishedAt: now,
            updatedAt: now,
            updatedBy: actor,
        };
        store.changes.push({
            id: `chg-${store.eventId}-${store.revision}`,
            publicationId: update.publicationId,
            revision: update.revision,
            drawRunId: detail.id,
            reason,
            confirmedBy: actor,
            confirmedAt: now,
            updatedAt: now,
            changes,
        });
        store.publicList = next;
        // 이 반영에 포함된 확정 실행은 모두 공개 이력이 생긴다
        for (const other of store.runs) {
            if (other.detail.status !== 'CONFIRMED' || other.detail.runNumber > detail.runNumber)
                continue;
            for (const result of other.detail.results) {
                if (result.resultType === 'SELECTED') result.wasPublished = true;
            }
            if (other.detail.runNumber > 1 && !other.appliedPublication)
                other.appliedPublication = update;
        }
        return ok(update, 200);
    }),

    // AD07 — 공개 명단 변경 이력 (Page, 최신 revision 먼저)
    http.get(api('/admin/events/:eventId/result-changes'), ({ params, request }) => {
        const eventId = String(params.eventId);
        if (!eventInfoOf(eventId)) return notFound();
        const store = getStore(eventId);
        const changes = store ? [...store.changes].reverse() : [];
        return ok(paginate(changes, new URL(request.url)));
    }),

    // AD09 — 취소에 연결된 재추첨 실행의 시작·재개. 이미 확정된 실행은 저장 결과를 돌려준다
    http.post(api('/admin/cancellations/:cancellationId/redraws'), ({ params }) => {
        const found = findCancellation(String(params.cancellationId));
        if (!found) return notFound();
        const { store, run } = found;
        if (store.canceled) return conflict('취소된 이벤트의 재추첨은 시작·재개할 수 없습니다.');

        const { detail } = run;
        if (detail.status === 'CONFIRMED') return ok(toRun(detail), 200);
        if (detail.status === 'FAILED') {
            detail.status = 'PREPARING';
            run.progressFrom = Date.now();
        }
        return ok(toRun(detail), 202);
    }),
];
