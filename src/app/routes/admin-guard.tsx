import type { ReactNode } from 'react';

import { Navigate } from 'react-router-dom';

import { useSessionStore } from '@entities/user';

// 관리자 권한의 실제 검증은 백엔드 세션/역할로 한다 (기획서 8.5절 — 역할 선택만으로 부여하지 않음).
// 이 가드는 라우팅 단계의 1차 차단 장치일 뿐이며, 인증 계약이 확정되면 세션 검증 로직으로 교체한다.
export function AdminGuard({ children }: { children: ReactNode }) {
    const role = useSessionStore((state) => state.role);
    if (role !== 'admin') {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
}
