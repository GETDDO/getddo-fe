import { useParams } from 'react-router-dom';

import { useEvent } from '@entities/event';
import { formatYmd } from '@shared/lib/date';

const CONTAINER = 'mx-auto w-full max-w-300 px-6 pt-20 pb-28';

export function EventDetailPage() {
    const { id = '' } = useParams();
    const { data: event, isPending, isError } = useEvent(id);

    if (isPending) {
        return (
            <main className={CONTAINER}>
                <p className="text-fg-tertiary text-body-sm">불러오는 중…</p>
            </main>
        );
    }

    if (isError) {
        return (
            <main className={CONTAINER}>
                <p className="text-destructive text-body-sm">이벤트를 불러오지 못했습니다.</p>
            </main>
        );
    }

    return (
        <main className={CONTAINER}>
            {(event.tags?.length ?? 0) > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    {event.tags?.map((tag) => (
                        <span
                            key={tag}
                            className="bg-status-active border-status-active-text text-status-active-text text-caption rounded-full border px-3 py-0.5"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            <h1 className="text-title-2 text-fg-primary mt-2">{event.title}</h1>

            <p className="text-body text-fg-tertiary mt-2">
                {formatYmd(event.startsAt)} ~ {formatYmd(event.endsAt)}
            </p>

            <hr className="border-border-default mt-6" />

            {/* 상세 본문은 이벤트마다 디자이너가 만드는 이미지 한 장이다 — 서버가 주는 URL을 그대로 띄운다 */}
            {event.detailImageUrl && (
                <img
                    src={event.detailImageUrl}
                    alt={`${event.title} 상세 안내`}
                    className="mx-auto mt-20 block h-auto w-full max-w-270"
                />
            )}
        </main>
    );
}
