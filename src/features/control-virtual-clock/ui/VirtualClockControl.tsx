import { Clock, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

import { formatKst } from '@shared/lib/date';
import { useVirtualClock } from '@shared/lib/virtual-clock';
import { Button } from '@shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Input } from '@shared/ui/input';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const SECOND_FORMAT: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
};

/** "YYYY-MM-DDTHH:mm" 입력값을 KST 시각으로 해석해 Date로 변환한다 (브라우저 TZ와 무관하게 동작) */
function parseKstLocal(value: string): Date | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
    if (!m) return null;
    const [ys, mos, ds, hs, mis] = m.slice(1);
    if (!ys || !mos || !ds || !hs || !mis) return null;
    // Date.UTC는 연도 0–99를 1900+n으로 해석하므로 setUTCFullYear로 입력 연도를 그대로 둔다
    const d = new Date(0);
    d.setUTCFullYear(+ys, +mos - 1, +ds);
    d.setUTCHours(+hs, +mis, 0, 0);
    const at = new Date(d.getTime() - KST_OFFSET_MS);
    return Number.isNaN(at.getTime()) ? null : at;
}

function formatOffset(diffMs: number): string {
    const minutes = Math.round(Math.abs(diffMs) / 60_000);
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;
    const parts = [
        days > 0 ? `${days}일` : '',
        hours > 0 ? `${hours}시간` : '',
        mins > 0 ? `${mins}분` : '',
    ].filter(Boolean);
    return `${diffMs >= 0 ? '+' : '-'}${parts.join(' ') || '0분'}`;
}

export function VirtualClockControl() {
    const { now, setOverride, override, isOverridden } = useVirtualClock();
    // 1초마다 갱신되는 실제 시각 — 오버라이드 차이와 비교 표시에 사용한다
    const [realNow, setRealNow] = useState<Date | null>(null);
    const [absolute, setAbsolute] = useState('');

    useEffect(() => {
        const id = setInterval(() => setRealNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const applyAbsolute = () => {
        const at = parseKstLocal(absolute);
        if (at) setOverride(at);
    };

    return (
        <div className="flex flex-col gap-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="size-4" />
                        현재 표시 시각
                        {isOverridden && (
                            <span className="bg-brand-primary/10 text-fg-brand text-caption rounded-full px-2 py-0.5 font-medium">
                                시간 여행 중
                            </span>
                        )}
                    </CardTitle>
                    <CardDescription>
                        카드·위젯에 표시되는 시각입니다. 오버라이드 중에는 이 시각으로 고정됩니다.
                        헤더의 시계에서도 시간·분을 직접 조작할 수 있습니다.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        <span className="text-title-2 tabular-nums">
                            {formatKst(now(), SECOND_FORMAT)}
                        </span>
                        {isOverridden && override && realNow && (
                            <span className="text-body-sm text-fg-tertiary">
                                실제 시각 {formatKst(realNow, SECOND_FORMAT)} (
                                {formatOffset(override.getTime() - realNow.getTime())})
                            </span>
                        )}
                    </div>
                    {isOverridden && (
                        <div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setOverride(null)}
                            >
                                <RotateCcw className="size-4" />
                                실제 시각으로 복귀
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>특정 시각 지정</CardTitle>
                    <CardDescription>KST 기준으로 입력한 날짜·시각으로 이동합니다.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="virtual-clock-at" className="text-body-sm font-medium">
                                이동할 시각
                            </label>
                            <Input
                                id="virtual-clock-at"
                                type="datetime-local"
                                step={600}
                                value={absolute}
                                onChange={(e) => setAbsolute(e.target.value)}
                                className="w-56"
                            />
                        </div>
                        <Button type="button" onClick={applyAbsolute} disabled={!absolute}>
                            지정
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
