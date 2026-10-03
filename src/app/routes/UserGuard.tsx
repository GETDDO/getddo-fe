import type { ReactNode } from 'react';

import { Navigate } from 'react-router-dom';

import { useSessionStore } from '@entities/user';

// 가상 사용자 미선택 상태에서는 로그인 화면으로 보낸다 (시연 로그인 흐름) — AdminGuard와 같은 라우팅 단계 가드다
export function UserGuard({ children }: { children: ReactNode }) {
    const user = useSessionStore((state) => state.user);
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
}
