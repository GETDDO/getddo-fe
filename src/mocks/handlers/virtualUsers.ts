import { http } from 'msw';
import { z } from 'zod';

import type { VirtualUser } from '@entities/user';

import { virtualUserSchema } from '@entities/user';
import { env } from '@shared/config/env';

import { ok } from './response';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

// 시연용 가상 사용자 — 동일 사용자는 고정 ID로 식별한다 (docs/product-context.md 페르소나·운영 범위)
// TODO(GD-213): 실서버 하이브리드에서는 id가 DB에 등록된 UUID여야 한다. 아래 vu-* 값은
// 목업 전용 플레이스홀더라 실서버 호출 시 형식 오류(COMMON-005)가 난다 — Vercel 등 배포 환경의
// VITE_VIRTUAL_USERS_JSON에 실제 등록 사용자 JSON을 넣어 교체한다
const fallbackVirtualUsers: VirtualUser[] = [
    {
        id: 'vu-doyoon',
        name: '김도윤',
        role: 'USER',
        membership: 'excellent',
        personaLabel: '데일리 루틴러',
    },
    {
        id: 'vu-seoyeon',
        name: '박서연',
        role: 'USER',
        membership: 'vip',
        personaLabel: '타임어택 헌터',
    },
    {
        id: 'vu-haneul',
        name: '이하늘',
        role: 'USER',
        membership: 'vvip',
        personaLabel: '신뢰중시 확인러',
    },
    {
        id: 'vu-minjun',
        name: '최민준',
        role: 'USER',
        membership: 'excellent',
        personaLabel: '라이트 참여형',
    },
    { id: 'vu-admin', name: '관리자', role: 'ADMIN', membership: 'excellent', personaLabel: null },
];

const virtualUserListSchema = z.array(virtualUserSchema);

const virtualUsers: VirtualUser[] = (() => {
    if (!env.virtualUsersJson) return fallbackVirtualUsers;
    try {
        return virtualUserListSchema.parse(JSON.parse(env.virtualUsersJson));
    } catch (error) {
        console.error(
            'VITE_VIRTUAL_USERS_JSON 해석 실패 — 기본 가상 사용자 목록을 사용한다:',
            error,
        );
        return fallbackVirtualUsers;
    }
})();

/**
 * 응모·자격 목업이 역할·멤버십을 판정할 때 쓴다 — 목업에 없는 사용자는
 * 일반 사용자(USER·excellent)로 본다 (시연용 X-User-ID는 임의 값이 올 수 있다)
 */
export function findMockVirtualUser(userId: string) {
    return virtualUsers.find((user) => user.id === userId) ?? null;
}

// /virtual-users는 spec에 없는 시연 전용 경로다 — 가상 사용자 선택 UI가 쓴다. 봉투 형태만 공통 계약을 따른다
export const virtualUserHandlers = [http.get(api('/virtual-users'), () => ok(virtualUsers))];
