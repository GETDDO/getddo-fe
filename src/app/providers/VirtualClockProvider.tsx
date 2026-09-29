import { useMemo, useState, type ReactNode } from 'react';

import { VirtualClockContext, type VirtualClockValue } from '@shared/lib/virtual-clock';

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
