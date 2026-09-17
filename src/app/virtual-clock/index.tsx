import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface VirtualClockValue {
    /** 오버라이드가 설정되어 있으면 그 시각, 아니면 실제 현재 시각을 반환 */
    now: () => Date;
    /** 관리자 시간 여행용 오버라이드. null을 넣으면 실제 시각으로 복귀 */
    setOverride: (at: Date | null) => void;
    isOverridden: boolean;
}

const VirtualClockContext = createContext<VirtualClockValue | null>(null);

export function VirtualClockProvider({ children }: { children: ReactNode }) {
    const [override, setOverride] = useState<Date | null>(null);

    const value = useMemo<VirtualClockValue>(
        () => ({
            now: () => override ?? new Date(),
            setOverride,
            isOverridden: override !== null,
        }),
        [override],
    );

    return <VirtualClockContext.Provider value={value}>{children}</VirtualClockContext.Provider>;
}

export function useVirtualClock() {
    const ctx = useContext(VirtualClockContext);
    if (!ctx) {
        throw new Error('useVirtualClock은 VirtualClockProvider 안에서만 사용할 수 있습니다');
    }
    return ctx;
}
