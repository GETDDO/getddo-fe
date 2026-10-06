import type { ReactNode } from 'react';

import { useReducedMotion } from 'framer-motion';
import { Clock, Flame } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import type { Event } from '@entities/event';

import { useEventList } from '@entities/event';
import { formatCountdown } from '@shared/lib/date';
import { useVirtualClock } from '@shared/lib/virtualClock';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { Pager } from '@shared/ui/pager';

import bannerBackground from '../assets/banner-bg.jpg';
import bannerMascot from '../assets/banner-mascot.webp';

const AUTO_SLIDE_MS = 5000;
const MAX_SLIDES = 5;
/** 피그마 홈 배너의 무너 캐릭터(image 28) — 배너 이미지 대신 고정 장식으로 보여준다 */
const SHOW_MASCOT = true;

export function BannerSlider({
    renderStatus,
}: {
    /** 현재 배너 이벤트의 실시간 현황 pill을 배너 안에 렌더링한다 — 위젯 간 참조를 피하기 위해 페이지가 슬롯으로 주입한다 */
    renderStatus?: (event: Event) => ReactNode;
}) {
    const { data: events, isPending, isError } = useEventList();
    const [index, setIndex] = useState(0);
    // 정지 조건을 축별로 분리한다 — 포커스가 안에 있는데 마우스만 빠져나가도 재생이 재개되지 않게
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    // 자동 넘김은 한 바퀴(모든 배너를 한 번씩 보여주고 첫 배너로 돌아오기)만 하고 멈춘다.
    // 사용자가 화살표로 직접 넘기면 그때부터는 자동 넘김을 끈다
    const [autoSteps, setAutoSteps] = useState(0);
    const [userControlled, setUserControlled] = useState(false);
    // 동작 줄이기 설정 사용자에게는 자동 슬라이드를 켜지 않는다
    const reduceMotion = useReducedMotion();
    // 마감 판정이 아닌 화면 표시 전용 카운트다운이므로 가상 시계의 시각을 쓴다
    const clock = useVirtualClock();
    const [now, setNow] = useState(() => clock.now());
    // 가상 시계 오버라이드가 바뀌면 렌더 단계에서 즉시 갱신한다 (effect setState는 lint 금지)
    const [lastClock, setLastClock] = useState(clock);
    if (lastClock !== clock) {
        setLastClock(clock);
        setNow(clock.now());
    }

    useEffect(() => {
        const timer = setInterval(() => setNow(clock.now()), 1000);
        return () => clearInterval(timer);
    }, [clock]);

    const slides = useMemo(
        () =>
            (events ?? [])
                .filter((event) => event.status === 'open' && event.requiredTickets > 0)
                .sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime())
                .slice(0, MAX_SLIDES),
        [events],
    );

    const autoplayStopped =
        slides.length <= 1 ||
        hovered ||
        focused ||
        userControlled ||
        autoSteps >= slides.length ||
        reduceMotion === true;

    useEffect(() => {
        if (autoplayStopped) {
            return;
        }
        const timer = setInterval(() => {
            setIndex((i) => (i + 1) % slides.length);
            setAutoSteps((n) => n + 1);
        }, AUTO_SLIDE_MS);
        return () => clearInterval(timer);
    }, [slides.length, autoplayStopped]);

    const safeIndex = Math.min(index, Math.max(slides.length - 1, 0));

    if (isPending) {
        return <div className="bg-surface-sunken h-[280px] w-full animate-pulse rounded-2xl" />;
    }

    if (isError || slides.length === 0) {
        return null;
    }

    return (
        <section
            className="relative flex flex-col gap-2"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocusCapture={() => setFocused(true)}
            onBlurCapture={(e) => {
                // 포커스가 섹션 안의 다른 요소로 옮겨갈 때는 유지한다
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    setFocused(false);
                }
            }}
        >
            {/* 모든 슬라이드를 한 줄로 나열 — 트랙 높이가 가장 큰 슬라이드로 고정돼 전환 중 크기 변환이 없고 transform만 애니메이션된다 */}
            <div className="overflow-hidden rounded-2xl">
                <div
                    className="flex ease-out motion-safe:transition-transform motion-safe:duration-500"
                    style={{ transform: `translateX(-${safeIndex * 100}%)` }}
                >
                    {slides.map((event, slideIndex) => {
                        const remainingMs = new Date(event.endsAt).getTime() - now.getTime();
                        return (
                            // 피그마 홈 배너 — 1200×365, 노란 배경 그림, 본문은 왼쪽 50·위 84에서 시작
                            <div
                                key={event.id}
                                // 화면 밖 배너는 Tab 포커스·보조 기술에서 빼 실시간 현황 알림도 보이는 배너만 읽힌다
                                inert={slideIndex !== safeIndex}
                                className="bg-play-yellow relative flex min-h-91.25 w-full shrink-0 flex-col bg-cover bg-right-bottom"
                                style={{ backgroundImage: `url(${bannerBackground})` }}
                            >
                                {/* 마감 시간 — 배너 왼쪽 끝에 붙은 흰 탭 (공용 Badge surface xl) */}
                                <Badge
                                    variant="surface"
                                    size="xl"
                                    className="absolute top-7.5 left-0 rounded-l-none pl-12.5 tabular-nums"
                                >
                                    <Clock />
                                    마감까지 {formatCountdown(remainingMs)}
                                </Badge>
                                <div className="flex flex-1 flex-col items-start gap-5 px-6 pt-21 pb-8 sm:px-12.5 sm:pb-8.75">
                                    <div className="flex max-w-150 flex-col gap-1">
                                        <div className="flex items-center gap-1">
                                            {/* 채운 불꽃 아이콘 — 아이콘·글자 모두 잉크(fg/primary) */}
                                            <Flame
                                                aria-hidden
                                                className="fill-fg-primary text-fg-primary size-5.5"
                                            />
                                            <span className="text-fg-primary text-body-sm-bold">
                                                오늘의 겟또타임
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <h2 className="text-title-1 text-fg-primary">
                                                {event.title}
                                            </h2>
                                            <p className="text-body text-fg-primary break-keep whitespace-pre-line">
                                                {event.description}
                                            </p>
                                            {renderStatus?.(event)}
                                        </div>
                                    </div>
                                    {/* 버튼은 배너 아래에서 35px 위에 고정 — 설명이 한 줄이어도 피그마와 같은 자리 */}
                                    <Button asChild size="lg" className="mt-auto px-7">
                                        <Link to={`/events/${event.id}`}>응모하기</Link>
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {/* 피그마 홈 — 배너 오른쪽에 무너 캐릭터가 배너 밖으로 살짝 걸쳐 있다 (넓은 화면만) */}
            {SHOW_MASCOT && (
                <img
                    src={bannerMascot}
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute -top-16.75 right-8 hidden w-125 select-none xl:block"
                />
            )}
            {slides.length > 1 && (
                <div className="relative z-10 flex justify-end">
                    {/* 피그마 홈 — 원형 화살표 사이에 '01 / 04' (공용 Pager) */}
                    <Pager
                        current={safeIndex}
                        total={slides.length}
                        prevLabel="이전 이벤트"
                        nextLabel="다음 이벤트"
                        onPrev={() => {
                            setUserControlled(true);
                            setIndex((safeIndex - 1 + slides.length) % slides.length);
                        }}
                        onNext={() => {
                            setUserControlled(true);
                            setIndex((safeIndex + 1) % slides.length);
                        }}
                    />
                </div>
            )}
        </section>
    );
}
