import { describe, expect, it } from 'vitest';

import { adminBannerListSchema, adminBannerSchema } from '@entities/banner';
import { apiClient } from '@shared/api/client';

interface Envelope<T> {
    success: boolean;
    code: string;
    data: T;
}

interface BannerBody {
    id: string;
    eventId: string;
    imageUrl: string;
    imageKey: string;
    displayOrder: number;
}

const call = (method: 'get' | 'post' | 'put' | 'delete', path: string, body?: unknown) =>
    apiClient.request<Envelope<unknown>>({
        method,
        url: path,
        data: body,
        validateStatus: () => true,
    });

const list = async () =>
    adminBannerListSchema.parse((await call('get', '/admin/banners')).data).data;

// 목업은 모듈 수준 상태를 들고 있어 테스트끼리 영향을 준다 — 순서에 의존하는 하나의 시나리오로 묶는다
describe('배너 목업 핸들러', () => {
    it('관리자 목록이 노출 순서대로 오고 공개 목록과 같은 순서다', async () => {
        const banners = await list();
        expect(banners.length).toBeGreaterThan(0);
        expect(banners.map((b) => b.displayOrder)).toEqual(
            [...banners.map((b) => b.displayOrder)].sort((a, b) => a - b),
        );

        const publicRes = await call('get', '/banners');
        const publicBanners = (publicRes.data as Envelope<BannerBody[]>).data;
        expect(publicBanners.map((b) => b.id)).toEqual(banners.map((b) => b.id));
        // 공개 DTO에는 imageKey 같은 관리자 필드가 없다
        expect(publicBanners[0]).not.toHaveProperty('imageKey');
    });

    it('등록은 입력을 검증하고 5개를 넘으면 409로 거절한다', async () => {
        const invalid = await call('post', '/admin/banners', {
            eventId: 'evt-001',
            imageKey: '',
            displayOrder: 0,
        });
        expect(invalid.status).toBe(400);

        const missingEvent = await call('post', '/admin/banners', {
            eventId: 'evt-없음',
            imageKey: 'banners/x.png',
            displayOrder: 0,
        });
        expect(missingEvent.status).toBe(404);

        let count = (await list()).length;
        while (count < 5) {
            const res = await call('post', '/admin/banners', {
                eventId: 'evt-001',
                imageKey: `banners/new-${count}.png`,
                displayOrder: count,
            });
            expect(res.status).toBe(201);
            adminBannerSchema.parse(res.data.data);
            count += 1;
        }

        const over = await call('post', '/admin/banners', {
            eventId: 'evt-001',
            imageKey: 'banners/over.png',
            displayOrder: 5,
        });
        expect(over.status).toBe(409);
        expect((await list()).length).toBe(5);
    });

    it('수정은 필드를 바꾸고 없는 배너는 404다', async () => {
        const [first] = await list();
        const res = await call('put', `/admin/banners/${first?.id}`, {
            eventId: 'evt-002',
            imageKey: 'banners/edited.png',
            displayOrder: first?.displayOrder,
        });
        expect(res.status).toBe(200);
        const updated = adminBannerSchema.parse(res.data.data);
        expect(updated.eventId).toBe('evt-002');
        expect(updated.imageKey).toBe('banners/edited.png');

        const missing = await call('put', '/admin/banners/없는-배너', {
            eventId: 'evt-001',
            imageKey: 'banners/x.png',
            displayOrder: 0,
        });
        expect(missing.status).toBe(404);
    });

    it('순서 변경은 전체 ID를 받아 반영하고 목록과 어긋나면 409다', async () => {
        const before = (await list()).map((b) => b.id);
        const reversed = [...before].reverse();

        const res = await call('put', '/admin/banners/order', { bannerIds: reversed });
        expect(res.status).toBe(200);
        const after = adminBannerListSchema.parse(res.data).data;
        expect(after.map((b) => b.id)).toEqual(reversed);
        expect((await list()).map((b) => b.id)).toEqual(reversed);

        // 일부 누락·중복·모르는 ID는 모두 거절하고 기존 순서를 유지한다
        const partial = await call('put', '/admin/banners/order', { bannerIds: reversed.slice(1) });
        expect(partial.status).toBe(409);
        const duplicated = await call('put', '/admin/banners/order', {
            bannerIds: [reversed[0], ...reversed.slice(0, -1)],
        });
        expect(duplicated.status).toBe(409);
        expect((await list()).map((b) => b.id)).toEqual(reversed);
    });

    it('삭제하면 목록에서 사라지고 다시 삭제하면 404다', async () => {
        const [target] = await list();
        const res = await call('delete', `/admin/banners/${target?.id}`);
        expect(res.status).toBe(200);
        expect((await list()).some((b) => b.id === target?.id)).toBe(false);

        const again = await call('delete', `/admin/banners/${target?.id}`);
        expect(again.status).toBe(404);
    });

    it('이벤트를 삭제하면 연결된 배너도 함께 삭제된다', async () => {
        const create = await call('post', '/admin/events', {
            title: '배너 연동 삭제 테스트',
            description: '테스트용 이벤트입니다',
            imageKey: null,
            eventType: 'NO_TICKET',
            weightingEnabled: false,
            maxTicketsPerUser: null,
            membershipRule: 'excellent',
            startsAt: '2099-06-01T00:00:00Z',
            endsAt: '2099-06-02T00:00:00Z',
            prizes: [{ rank: 1, name: '경품', winnerCount: 1, description: null, imageKey: null }],
        });
        expect(create.status).toBe(201);
        const eventId = (create.data as Envelope<{ id: string }>).data.id;

        const banner = await call('post', '/admin/banners', {
            eventId,
            imageKey: 'banners/linked.png',
            displayOrder: 0,
        });
        expect(banner.status).toBe(201);

        expect((await call('delete', `/admin/events/${eventId}`)).status).toBe(200);
        expect((await list()).some((b) => b.eventId === eventId)).toBe(false);
    });
});
