import { Badge } from '@shared/ui/badge';

import type { MyResultStatus } from '../model/types';

// 본인 결과 칩 — 발표 대기는 흰 바탕 테두리, 당첨은 응모권 노랑(보상), 미당첨은 회색으로 한 단계 낮춘다.
// 응모하지 않음·취소처럼 내 응모 내역에 드물게 오는 값은 회색 칩으로 이름만 보인다
const RESULT_META: Record<
    MyResultStatus,
    { label: string; variant: 'outline' | 'neutral'; className?: string }
> = {
    PENDING: { label: '발표 대기', variant: 'outline', className: 'text-fg-primary' },
    WON: { label: '당첨', variant: 'neutral', className: 'bg-ticket-primary text-ticket-on' },
    LOST: { label: '미당첨', variant: 'neutral', className: 'text-fg-tertiary' },
    CANCELED: { label: '취소', variant: 'neutral' },
    NOT_ENTERED: { label: '미응모', variant: 'neutral' },
    EXCLUDED: { label: '제외', variant: 'neutral' },
};

/** 내 결과 칩 (E09 my-result) — 결과를 아직 못 받았으면 발표 대기로 보지 않고 자리만 비운다 */
export function MyResultBadge({ result }: { result: MyResultStatus }) {
    const meta = RESULT_META[result];
    return (
        <Badge variant={meta.variant} className={meta.className}>
            {meta.label}
        </Badge>
    );
}
