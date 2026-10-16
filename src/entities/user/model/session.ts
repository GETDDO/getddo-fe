import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { VirtualUser } from './types';

interface SessionState {
    user: VirtualUser | null;
    selectUser: (user: VirtualUser) => void;
    signOut: () => void;
}

// 백엔드 인증 연동 전까지 쓰는 시연용 세션 스토어 — 로그인 화면에서 가상 사용자를 선택해 진입한다.
// 관리자 역할도 선택할 수 있지만 실제 권한은 서버 검증으로만 부여한다
// (docs/product-context.md 비기능 '시연 로그인 및 관리자 보호').
export const useSessionStore = create<SessionState>()(
    persist(
        (set) => ({
            user: null,
            selectUser: (user) => set({ user }),
            signOut: () => set({ user: null }),
        }),
        { name: 'getddo-session' },
    ),
);
