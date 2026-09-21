import type { ReactNode } from 'react';

import { ChevronLeft, ChevronRight, Clock, Flame } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import type { Event } from '@entities/event';

import { useEventList } from '@entities/event';
import { formatCountdown } from '@shared/lib/date';
import { Button } from '@shared/ui/button';

const AUTO_SLIDE_MS = 5000;
const MAX_SLIDES = 5;

export function BannerSlider({
    renderStatus,
}: {
    /** 현재 배너 이벤트의 실시간 현황 pill을 배너 안에 렌더링한다 — 위젯 간 참조를 피하기 위해 페이지가 슬롯으로 주입한다 */
    renderStatus?: (event: Event) => ReactNode;
}) {
    const { data: events, isPending, isError } = useEventList();
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    // FSD 경계상 app/virtual-clock은 widgets에서 참조할 수 없다 — 마감 판정이 아닌 화면 표시 전용 카운트다운이므로 여기서는 실제 시각을 직접 쓴다
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const slides = useMemo(
        () =>
            (events ?? [])
                .filter((event) => event.status === 'open' && event.requiredTickets > 0)
                .sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime())
                .slice(0, MAX_SLIDES),
        [events],
    );

    useEffect(() => {
        if (slides.length <= 1 || paused) {
            return;
        }
        const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTO_SLIDE_MS);
        return () => clearInterval(timer);
    }, [slides.length, paused]);

    const safeIndex = Math.min(index, Math.max(slides.length - 1, 0));

    if (isPending) {
        return <div className="bg-surface-sunken h-[280px] w-full animate-pulse rounded-2xl" />;
    }

    if (isError || slides.length === 0) {
        return null;
    }

    return (
        <section
            className="flex flex-col gap-3"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {/* 모든 슬라이드를 한 줄로 나열 — 트랙 높이가 가장 큰 슬라이드로 고정돼 전환 중 크기 변환이 없고 transform만 애니메이션된다 */}
            <div className="overflow-hidden rounded-2xl">
                <div
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${safeIndex * 100}%)` }}
                >
                    {slides.map((event) => {
                        const remainingMs = new Date(event.endsAt).getTime() - now.getTime();
                        return (
                            <div
                                key={event.id}
                                className="bg-play-yellow w-full shrink-0 p-8 sm:p-10"
                            >
                                <div className="flex items-start justify-between gap-6">
                                    <div className="flex flex-col gap-4">
                                        {/* 디자인상 카운트다운 pill이 배너 왼쪽 가장자리에 붙은 탭 형태 — 음수 마진으로 패딩을 상쇄하고 왼쪽 radius를 제거해 가장자리에 평평하게 붙인다 */}
                                        <span className="bg-surface-page text-fg-primary text-body-sm-bold -ml-8 flex w-fit items-center gap-1.5 rounded-r-full py-2 pr-3 pl-8 shadow-md sm:-ml-10 sm:pl-10">
                                            <Clock className="size-4" />
                                            마감까지 {formatCountdown(remainingMs)}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Flame className="text-brand-primary size-5" />
                                            <span className="text-brand-primary text-body-sm-bold">
                                                오늘의 타임 래플
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <h2 className="text-title-2 text-fg-primary">
                                                {event.title}
                                            </h2>
                                            <p className="text-body text-fg-primary whitespace-pre-line">
                                                {event.description}
                                            </p>
                                        </div>
                                        {renderStatus?.(event)}
                                        <div>
                                            <Button
                                                asChild
                                                variant="secondary"
                                                size="lg"
                                                className="h-auto px-7 py-4 text-base"
                                            >
                                                <Link to={`/events/${event.id}`}>응모하기</Link>
                                            </Button>
                                        </div>
                                    </div>
                                    {event.bannerImageUrl && (
                                        <img
                                            src={event.bannerImageUrl}
                                            alt=""
                                            className="hidden w-72 shrink-0 sm:block"
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {slides.length > 1 && (
                <div className="flex justify-end">
                    <div className="bg-surface-page border-border-default flex items-center gap-1 rounded-full border px-2 py-1 shadow-sm">
                        <button
                            type="button"
                            aria-label="이전 이벤트"
                            onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
                            className="text-fg-primary flex size-6 items-center justify-center"
                        >
                            <ChevronLeft className="size-5" />
                        </button>
                        <span className="text-caption text-fg-primary">
                            {String(safeIndex + 1).padStart(2, '0')} /{' '}
                            {String(slides.length).padStart(2, '0')}
                        </span>
                        <button
                            type="button"
                            aria-label="다음 이벤트"
                            onClick={() => setIndex((i) => (i + 1) % slides.length)}
                            className="text-fg-primary flex size-6 items-center justify-center"
                        >
                            <ChevronRight className="size-5" />
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
