import { create } from 'zustand';

import { env } from '@shared/config/env';

export type UserRole = 'user' | 'admin';

interface SessionState {
    role: UserRole;
    setRole: (role: UserRole) => void;
}

// 백엔드 인증 연동 전까지 쓰는 임시 세션 스토어.
// MSW 개발 환경에서만 기본 admin으로 시작해 관리자 화면을 확인할 수 있게 하고,
// 실제 환경에서는 기본 user로 시작한다 (관리자 권한은 서버 검증으로만 부여 — docs/product-context.md 비기능 '시연 로그인 및 관리자 보호').
export const useSessionStore = create<SessionState>((set) => ({
    role: env.enableMsw ? 'admin' : 'user',
    setRole: (role) => set({ role }),
}));
