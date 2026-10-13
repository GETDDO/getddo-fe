import { Link } from 'react-router-dom';

import type { Event } from '@entities/event';

import { useEventList } from '@entities/event';
import { useSessionStore } from '@entities/user';
import { KST_HOUR_MINUTE, formatKst, kstDayDiff } from '@shared/lib/date';
import { formatNumber } from '@shared/lib/format';
import { Button } from '@shared/ui/button';

import loseMascot from '../assets/lose-mascot.png';

interface LoseBannerProps {
    event: Event;
    onReset: () => void;
}

/**
 * 조회했지만 명단에 없을 때의 머리 배너.
 *
 * '없음'만 알리고 끝내지 않고 다음에 할 수 있는 일을 같이 둔다 — 쓴 응모권과 다음 래플이다.
 * 뒷자리를 잘못 눌렀을 수도 있으므로 '다시 조회'를 늘 함께 둔다.
 */
export function LoseBanner({ event, onReset }: LoseBannerProps) {
    const userName = useSessionStore((state) => state.user?.name);
    const nextRaffle = useNextRaffle(event.id);

    const entryCount = event.myEntryCount ?? 0;
    const usedTickets = event.myTicketCount ?? entryCount * event.requiredTickets;

    return (
        <section className="bg-surface-page border-border-default flex flex-col gap-6 rounded-2xl border p-6 lg:flex-row lg:items-center">
            {/* 분위기를 전하는 장식이라 읽어 줄 내용이 없다 — 결과는 옆 글에서 그대로 읽힌다 */}
            <img src={loseMascot} alt="" className="size-42 shrink-0 object-contain" />

            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                <h3 className="text-title-2 text-fg-primary">아쉽지만 이번엔 당첨되지 않았어요</h3>
                <p className="text-body text-fg-secondary">
                    {userName ? `${userName}님, ` : ''}다음 래플에서 꼭 다시 만나요. 응모권은
                    출석·게임·미션으로 다시 모을 수 있어요.
                </p>

                <div className="flex flex-wrap gap-2">
                    {/* 응모하지 않은 래플에 '0장'을 적으면 참여했는데 아무것도 쓰지 않은 것처럼 읽힌다 */}
                    {entryCount > 0 && (
                        <Pill label="이번에 쓴 응모권" value={`${formatNumber(usedTickets)}장`} />
                    )}
                    {nextRaffle && (
                        <Pill label="다음 타임래플" value={nextRaffleLabel(nextRaffle)} />
                    )}
                </div>
            </div>

            <div className="flex shrink-0 flex-col items-stretch gap-2 lg:w-50">
                <Button asChild>
                    <Link to={nextRaffle ? `/time-raffle/${nextRaffle.id}` : '/time-raffle'}>
                        다음 타임래플 보기
                    </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={onReset}>
                    다른 번호로 다시 조회
                </Button>
            </div>
        </section>
    );
}

function Pill({ label, value }: { label: string; value: string }) {
    return (
        <span className="bg-surface-sunken flex items-center gap-2 rounded-full px-3.5 py-1.5">
            <span className="text-body-sm text-fg-tertiary">{label}</span>
            <span className="text-body-sm-bold text-fg-primary">{value}</span>
        </span>
    );
}

/**
 * 지금 열려 있거나 가장 먼저 열릴 다른 타임래플.
 *
 * 목록 화면에서 들어오는 경로가 대부분이라 같은 쿼리가 이미 캐시에 있다 — 새 요청이 아니다.
 */
function useNextRaffle(currentEventId: string): Event | undefined {
    const { data: events } = useEventList();

    return events
        ?.filter(
            (event) =>
                event.isTimeRaffle &&
                event.id !== currentEventId &&
                (event.status === 'open' || event.status === 'upcoming'),
        )
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
        .at(0);
}

/** 진행 중이면 마감 시각을, 예정이면 오픈 시각을 적는다 */
function nextRaffleLabel(event: Event): string {
    const at = event.status === 'open' ? event.endsAt : event.startsAt;
    const day = kstDayDiff(at, new Date());
    const prefix =
        day === 0 ? '오늘' : day === 1 ? '내일' : formatKst(at, { month: 'long', day: 'numeric' });
    return `${prefix} ${formatKst(at, KST_HOUR_MINUTE)}`;
}
