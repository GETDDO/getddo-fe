import { http, HttpResponse } from 'msw';

import type { VirtualUser } from '@entities/user';

import { env } from '@shared/config/env';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

// 시연용 가상 사용자 — 동일 사용자는 고정 ID로 식별한다 (docs/product-context.md 페르소나·운영 범위)
const virtualUsers: VirtualUser[] = [
    { id: 'vu-doyoon', name: '김도윤', role: 'USER', personaLabel: '데일리 루틴러' },
    { id: 'vu-seoyeon', name: '박서연', role: 'USER', personaLabel: '타임어택 헌터' },
    { id: 'vu-haneul', name: '이하늘', role: 'USER', personaLabel: '신뢰중시 확인러' },
    { id: 'vu-minjun', name: '최민준', role: 'USER', personaLabel: '라이트 참여형' },
    { id: 'vu-admin', name: '관리자', role: 'ADMIN', personaLabel: null },
];

export const virtualUserHandlers = [
    http.get(api('/virtual-users'), () => HttpResponse.json(virtualUsers)),
];
