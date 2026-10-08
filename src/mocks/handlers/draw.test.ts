import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@shared/api/client';
import { IDEMPOTENCY_HEADER } from '@shared/lib/idempotencyKey';

import { resetMockDraws } from './draw';

/*
 * 추첨 목업이 getddo-spec 05-api/drawing.md AD01~AD09 초안을 지키는지 검증한다.
 * 경로 문자열을 상수화하지 않고 리터럴로 적어, 상수와 핸들러가 함께 틀려도 계약 위반이 드러나게 한다.
 * 목업은 모듈 수준 상태를 들고 있어 테스트마다 초기화하고, 시간 경과는 Date만 가짜로 돌려 재현한다.
 */

interface Envelope<T> {
    success: boolean;
    code: string;
    data: T;
}

interface Page<T> {
    items: T[];
    page: number;
    size: number;
    totalElements: number;
}

interface RunBody {
    id: string;
    runNumber: number;
    status: string;
    originalDrawId: string | null;
}

interface ResultBody {
    id: string;
    userId: string | null;
    resultType: string;
    isCanceled: boolean;
    wasPublished: boolean;
    slotNumber: number;
}

interface DetailBody extends RunBody {
    results: ResultBody[];
    cancellations: { id: string; reason: string; canceledDrawResultId: string }[];
    lastFailureCode: string | null;
}

const call = <T = unknown>(
    method: 'get' | 'post',
    path: string,
    options: { body?: unknown; key?: string } = {},
) =>
    apiClient.request<Envelope<T>>({
        method,
        url: path,
        data: options.body,
        headers: options.key ? { [IDEMPOTENCY_HEADER]: options.key } : undefined,
        validateStatus: () => true,
    });

// evt-009는 오래전에 마감돼 최초 발표가 끝난 시드 이벤트다 (당첨 30명 / 후보 33명)
const EVENT = 'evt-009';
// 발표 전(adm-905), 취소됨(adm-902), 재추첨 실패(adm-904) 시드
const UNPUBLISHED_EVENT = 'adm-905';
const CANCELED_EVENT = 'adm-902';
const FAILED_EVENT = 'adm-904';

async function firstRun(eventId: string) {
    const list = await call<Page<RunBody>>('get', `/admin/events/${eventId}/draws`);
    expect(list.status).toBe(200);
    const original = list.data.data.items.find((r) => r.runNumber === 1)!;
    const detail = await call<DetailBody>('get', `/admin/draws/${original.id}`);
    return detail.data.data;
}

async function cancelFirstWinner(eventId: string, key = 'key-1', reason = '본인 확인 실패') {
    const original = await firstRun(eventId);
    const win = original.results.find((r) => r.resultType === 'SELECTED' && !r.isCanceled)!;
    const res = await call<{
        cancellationId: string;
        canceledDrawResultId: string;
        replacementDrawRunId: string;
        status: string;
    }>('post', `/admin/wins/${win.id}/cancellations`, { body: { reason }, key });
    return { original, win, res };
}

/** 재추첨 실행이 서버에서 확정되는 시간만큼 Date를 앞으로 돌린다 */
const settleRedraw = () => vi.setSystemTime(Date.now() + 10_000);

describe('추첨 목업', () => {
    beforeEach(() => {
        resetMockDraws();
        vi.useFakeTimers({ toFake: ['Date'] });
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('AD01은 최신 실행부터 Page 봉투로 돌려주고, 후보는 33건이다', async () => {
        const list = await call<Page<RunBody>>(
            'get',
            `/admin/events/${EVENT}/draws?page=1&size=20`,
        );
        expect(list.status).toBe(200);
        expect(list.data.success).toBe(true);
        expect(list.data.data.totalElements).toBe(1);
        expect(list.data.data.items[0]).toMatchObject({ runNumber: 1, status: 'CONFIRMED' });

        const original = await firstRun(EVENT);
        const candidates = await call<
            Page<{ userId: string; ticketCount: number; weight: number }>
        >('get', `/admin/draws/${original.id}/participants?page=1&size=10`);
        expect(candidates.data.data.totalElements).toBe(33);
        expect(candidates.data.data.items).toHaveLength(10);
        // 가중치는 등급별 실제 차감 장수와 별개 값이다
        expect(candidates.data.data.items.some((c) => c.weight !== c.ticketCount)).toBe(true);
    });

    it('없는 이벤트와 실행은 404 봉투를 돌려준다', async () => {
        const noEvent = await call('get', '/admin/events/nope/draws');
        expect(noEvent.status).toBe(404);
        expect(noEvent.data.success).toBe(false);
        expect((await call('get', '/admin/draws/drw-nope-r1')).status).toBe(404);
    });

    it('AD04는 확정 실행을 검증해 201로 기록하고 AD08에서 최신순으로 조회된다', async () => {
        const original = await firstRun(EVENT);
        const check = await call<{ passed: boolean; checks: { passed: boolean }[] }>(
            'post',
            `/admin/draws/${original.id}/checks`,
        );
        expect(check.status).toBe(201);
        expect(check.data.data.passed).toBe(true);
        expect(check.data.data.checks.length).toBeGreaterThan(0);

        const history = await call<Page<{ drawRunId: string }>>(
            'get',
            `/admin/draws/${original.id}/checks`,
        );
        expect(history.data.data.totalElements).toBe(1);
        expect(history.data.data.items[0]?.drawRunId).toBe(original.id);
    });

    it('AD04는 확정되지 않은 실행이면 409다', async () => {
        const { res } = await cancelFirstWinner(EVENT);
        const check = await call(
            'post',
            `/admin/draws/${res.data.data.replacementDrawRunId}/checks`,
        );
        expect(check.status).toBe(409);
    });

    it('AD05는 멱등키와 사유가 없으면 400이다', async () => {
        const original = await firstRun(EVENT);
        const win = original.results[0]!;
        const noKey = await call('post', `/admin/wins/${win.id}/cancellations`, {
            body: { reason: '사유' },
        });
        expect(noKey.status).toBe(400);
        const noReason = await call('post', `/admin/wins/${win.id}/cancellations`, {
            body: { reason: '  ' },
            key: 'k',
        });
        expect(noReason.status).toBe(400);
    });

    it('AD05는 202로 취소와 재추첨 실행을 함께 등록하고, 같은 요청 재시도는 200이다', async () => {
        const { win, res } = await cancelFirstWinner(EVENT, 'cancel-a');
        expect(res.status).toBe(202);
        expect(res.data.data).toMatchObject({
            canceledDrawResultId: win.id,
            status: 'PREPARING',
        });

        const retry = await call<typeof res.data.data>(
            'post',
            `/admin/wins/${win.id}/cancellations`,
            { body: { reason: '본인 확인 실패' }, key: 'cancel-a' },
        );
        expect(retry.status).toBe(200);
        expect(retry.data.data.cancellationId).toBe(res.data.data.cancellationId);

        // 재시도로 재추첨 실행이 중복 생성되지 않는다
        const list = await call<Page<RunBody>>('get', `/admin/events/${EVENT}/draws`);
        expect(list.data.data.totalElements).toBe(2);
    });

    it('AD05는 같은 키에 다른 본문이면 IDEMPOTENCY_CONFLICT, 다른 키로 이미 취소된 당첨이면 STATE_CONFLICT 409다', async () => {
        const { win } = await cancelFirstWinner(EVENT, 'cancel-b');
        const reused = await call('post', `/admin/wins/${win.id}/cancellations`, {
            body: { reason: '다른 사유' },
            key: 'cancel-b',
        });
        expect(reused.status).toBe(409);
        expect(reused.data.code).toBe('IDEMPOTENCY_CONFLICT');

        const again = await call('post', `/admin/wins/${win.id}/cancellations`, {
            body: { reason: '본인 확인 실패' },
            key: 'cancel-b2',
        });
        expect(again.status).toBe(409);
        expect(again.data.code).toBe('STATE_CONFLICT');
    });

    it('AD05는 취소된 이벤트의 당첨이면 409다', async () => {
        const original = await firstRun(CANCELED_EVENT);
        const win = original.results.find((r) => r.resultType === 'SELECTED')!;
        const res = await call('post', `/admin/wins/${win.id}/cancellations`, {
            body: { reason: '사유' },
            key: 'k-canceled',
        });
        expect(res.status).toBe(409);
    });

    it('재추첨은 시간이 지나면 확정되고 취소자를 제외한 새 당첨자로 빈 자리를 채운다', async () => {
        const { win, res, original } = await cancelFirstWinner(EVENT, 'cancel-c');
        const canceled = original.results.find((r) => r.id === win.id)!;

        settleRedraw();
        const detail = await call<DetailBody>(
            'get',
            `/admin/draws/${res.data.data.replacementDrawRunId}`,
        );
        expect(detail.data.data.status).toBe('CONFIRMED');
        expect(detail.data.data.originalDrawId).toBe(original.id);
        expect(detail.data.data.cancellations[0]?.canceledDrawResultId).toBe(win.id);
        const replacement = detail.data.data.results[0]!;
        expect(replacement.slotNumber).toBe(canceled.slotNumber);
        expect(replacement.userId).not.toBe(canceled.userId);

        // 취소 전 결과는 공개 이력과 취소 여부가 함께 true일 수 있다
        const afterCancel = await firstRun(EVENT);
        expect(afterCancel.results.find((r) => r.id === win.id)).toMatchObject({
            isCanceled: true,
            wasPublished: true,
        });
    });

    it('AD09는 진행 중이면 202, 확정 후에는 저장 결과를 200으로 돌려준다', async () => {
        const { res } = await cancelFirstWinner(EVENT, 'cancel-d');
        const cancellationId = res.data.data.cancellationId;

        const running = await call<RunBody>(
            'post',
            `/admin/cancellations/${cancellationId}/redraws`,
        );
        expect(running.status).toBe(202);
        expect(running.data.data.id).toBe(res.data.data.replacementDrawRunId);

        settleRedraw();
        const done = await call<RunBody>('post', `/admin/cancellations/${cancellationId}/redraws`);
        expect(done.status).toBe(200);
        expect(done.data.data.status).toBe('CONFIRMED');

        const list = await call<Page<RunBody>>('get', `/admin/events/${EVENT}/draws`);
        expect(list.data.data.totalElements).toBe(2);
        expect((await call('post', '/admin/cancellations/can-nope-1/redraws')).status).toBe(404);
    });

    it('AD09는 실패한 실행을 재개해 확정까지 진행시킨다', async () => {
        const list = await call<Page<RunBody>>('get', `/admin/events/${FAILED_EVENT}/draws`);
        const failed = list.data.data.items.find((r) => r.status === 'FAILED')!;
        const detail = await call<DetailBody>('get', `/admin/draws/${failed.id}`);
        expect(detail.data.data.lastFailureCode).toBeTruthy();

        const resume = await call<RunBody>(
            'post',
            `/admin/cancellations/${detail.data.data.cancellations[0]!.id}/redraws`,
        );
        expect(resume.status).toBe(202);
        expect(resume.data.data.status).toBe('PREPARING');

        settleRedraw();
        const after = await call<DetailBody>('get', `/admin/draws/${failed.id}`);
        expect(after.data.data.status).toBe('CONFIRMED');
    });

    it('AD06은 재추첨 결과를 공개 명단에 반영하고 AD07에 변경 이력을 남기며 재반영은 중복 생성하지 않는다', async () => {
        const { win, res } = await cancelFirstWinner(EVENT, 'cancel-e');
        const redrawId = res.data.data.replacementDrawRunId;

        // 확정 전에는 반영할 수 없다
        const early = await call('post', `/admin/draws/${redrawId}/publication`, {
            body: { reason: '재추첨 확인' },
        });
        expect(early.status).toBe(409);

        settleRedraw();
        const noReason = await call('post', `/admin/draws/${redrawId}/publication`, {
            body: { reason: '' },
        });
        expect(noReason.status).toBe(400);

        const applied = await call<{ revision: number; drawRunId: string }>(
            'post',
            `/admin/draws/${redrawId}/publication`,
            { body: { reason: '재추첨 결과 확인' } },
        );
        expect(applied.status).toBe(200);
        expect(applied.data.data).toMatchObject({ drawRunId: redrawId, revision: 2 });

        const again = await call<{ revision: number }>(
            'post',
            `/admin/draws/${redrawId}/publication`,
            {
                body: { reason: '재추첨 결과 확인' },
            },
        );
        expect(again.status).toBe(200);
        expect(again.data.data.revision).toBe(2);

        const changes = await call<
            Page<{
                revision: number;
                reason: string;
                changes: { beforeUserId: string | null; afterUserId: string | null }[];
            }>
        >('get', `/admin/events/${EVENT}/result-changes`);
        expect(changes.data.data.totalElements).toBe(1);
        const change = changes.data.data.items[0]!;
        expect(change.revision).toBe(2);
        expect(change.reason).toBe('재추첨 결과 확인');
        expect(change.changes).toHaveLength(1);
        expect(change.changes[0]?.beforeUserId).toBe(
            (await firstRun(EVENT)).results.find((r) => r.id === win.id)?.userId,
        );
        expect(change.changes[0]?.afterUserId).toBeTruthy();
    });

    it('AD06은 최초 발표 전이거나 재추첨이 아닌 실행이면 409다', async () => {
        // 최초 발표 전 이벤트: 재추첨이 확정돼도 이 API로 반영할 수 없다
        const { res } = await cancelFirstWinner(UNPUBLISHED_EVENT, 'cancel-f');
        settleRedraw();
        const beforeFirst = await call(
            'post',
            `/admin/draws/${res.data.data.replacementDrawRunId}/publication`,
            {
                body: { reason: '확인' },
            },
        );
        expect(beforeFirst.status).toBe(409);

        // 최초 실행은 재추첨이 아니다
        const original = await firstRun(EVENT);
        const notRedraw = await call('post', `/admin/draws/${original.id}/publication`, {
            body: { reason: '확인' },
        });
        expect(notRedraw.status).toBe(409);
    });
});
