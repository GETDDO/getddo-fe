import { useCallback, useMemo, useState } from 'react';

import type { AdminBanner } from '@entities/banner';

import { AdminBannerTable, BANNER_MAX_COUNT, useAdminBanners } from '@entities/banner';
import { useAdminEvents } from '@entities/event';
import {
    BannerFormDialog,
    bannerErrorMessage,
    DeleteBannerDialog,
    moveBannerId,
    useReorderBanners,
} from '@features/manageBanner';
import { Button } from '@shared/ui/button';

// 연결 이벤트 선택지·제목 해석용 — 이벤트 수가 한 번에 담기는 시연 규모를 전제로 한 페이지로 받는다
const EVENT_LOOKUP_SIZE = 100;

export function AdminBannersPage() {
    const { data: banners, isPending, isError } = useAdminBanners();
    const { data: eventPage } = useAdminEvents({ page: 1, size: EVENT_LOOKUP_SIZE });
    const reorder = useReorderBanners();

    // 등록은 'new', 수정은 대상 배너, 닫힘은 null
    const [formTarget, setFormTarget] = useState<AdminBanner | 'new' | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AdminBanner | null>(null);

    const events = useMemo(
        () => (eventPage?.items ?? []).map(({ id, title }) => ({ id, title })),
        [eventPage],
    );
    const eventTitleOf = useCallback(
        (eventId: string) =>
            events.find((event) => event.id === eventId)?.title ??
            '(삭제되었거나 알 수 없는 이벤트)',
        [events],
    );

    const handleMove = useCallback(
        (banner: AdminBanner, direction: 'up' | 'down') => {
            const next = moveBannerId(
                (banners ?? []).map((item) => item.id),
                banner.id,
                direction,
            );
            if (next) reorder.mutate(next);
        },
        [banners, reorder],
    );
    const handleEdit = useCallback((banner: AdminBanner) => setFormTarget(banner), []);
    const handleDelete = useCallback((banner: AdminBanner) => setDeleteTarget(banner), []);

    const count = banners?.length ?? 0;
    const full = count >= BANNER_MAX_COUNT;
    const editing = formTarget !== null && formTarget !== 'new' ? formTarget : null;
    const nextDisplayOrder = banners?.length
        ? Math.max(...banners.map((banner) => banner.displayOrder)) + 1
        : 0;

    return (
        <div className="flex max-w-280 flex-col gap-6 pr-10 pb-10">
            <div className="flex flex-wrap items-center gap-3">
                <p className="text-body-sm text-fg-secondary">
                    홈 화면 상단에 노출됩니다. 위쪽 배너가 먼저 보이며 최대 {BANNER_MAX_COUNT}개까지
                    등록할 수 있습니다{banners ? ` (현재 ${count}개)` : ''}.
                </p>
                <Button
                    className="ml-auto"
                    disabled={isPending || isError || full}
                    onClick={() => setFormTarget('new')}
                >
                    배너 등록
                </Button>
            </div>
            {full && (
                <p className="text-fg-tertiary text-body-sm">
                    배너가 {BANNER_MAX_COUNT}개라 더 등록할 수 없습니다. 기존 배너를 삭제하면 등록할
                    수 있습니다.
                </p>
            )}

            {isPending && <p className="text-body-sm text-fg-tertiary">불러오는 중…</p>}
            {isError && (
                <p role="alert" className="text-destructive text-body-sm">
                    배너 목록을 불러오지 못했습니다.
                </p>
            )}
            {banners && banners.length === 0 && (
                <p className="text-fg-tertiary text-body-sm py-6">등록된 배너가 없습니다.</p>
            )}
            {reorder.isError && (
                <p role="alert" className="text-destructive text-body-sm">
                    {bannerErrorMessage(
                        reorder.error,
                        '노출 순서를 바꾸지 못했습니다. 다시 시도해주세요.',
                    )}
                </p>
            )}
            {banners && banners.length > 0 && (
                <AdminBannerTable
                    banners={banners}
                    eventTitleOf={eventTitleOf}
                    onMove={handleMove}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    disabled={reorder.isPending}
                />
            )}

            <BannerFormDialog
                open={formTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setFormTarget(null);
                }}
                banner={editing}
                events={events}
                nextDisplayOrder={nextDisplayOrder}
            />
            <DeleteBannerDialog
                banner={deleteTarget}
                eventTitle={deleteTarget ? eventTitleOf(deleteTarget.eventId) : ''}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
            />
        </div>
    );
}
