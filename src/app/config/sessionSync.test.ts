import type { AxiosAdapter, AxiosResponse } from 'axios';

import { afterEach, describe, expect, it } from 'vitest';

import type { VirtualUser } from '@entities/user';

import { useSessionStore } from '@entities/user';
import { apiClient } from '@shared/api/client';

import './sessionSync';

const ADMIN: VirtualUser = {
    id: 'user-admin-1',
    name: '관리자',
    role: 'ADMIN',
    membership: 'vvip',
    personaLabel: null,
};
const USER: VirtualUser = { ...ADMIN, id: 'user-1', name: '일반', role: 'USER', membership: 'vip' };

// 네트워크 없이 인터셉터를 거친 최종 요청 설정만 확인한다
const adapter: AxiosAdapter = (config) =>
    Promise.resolve({
        data: null,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
    } as AxiosResponse);

async function sentHeaders() {
    const { config } = await apiClient.get('/v1/anything', { adapter });
    return config.headers;
}

describe('사용자 문맥 헤더 인터셉터', () => {
    afterEach(() => useSessionStore.setState({ user: null }));

    it('세션 사용자의 ID·역할·멤버십을 헤더로 보낸다', async () => {
        useSessionStore.setState({ user: ADMIN });
        const headers = await sentHeaders();

        expect(headers.get('X-User-ID')).toBe('user-admin-1');
        expect(headers.get('X-User-Role')).toBe('ADMIN');
        expect(headers.get('X-User-Membership')).toBe('vvip');
    });

    it('일반 사용자는 USER 역할을 보낸다', async () => {
        useSessionStore.setState({ user: USER });
        expect((await sentHeaders()).get('X-User-Role')).toBe('USER');
    });

    it('세션이 없으면 사용자 문맥 헤더를 보내지 않는다', async () => {
        const headers = await sentHeaders();

        expect(headers.has('X-User-ID')).toBe(false);
        expect(headers.has('X-User-Role')).toBe(false);
        expect(headers.has('X-User-Membership')).toBe(false);
    });
});
