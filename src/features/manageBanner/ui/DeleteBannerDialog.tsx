import { toast } from 'sonner';

import type { AdminBanner } from '@entities/banner';

import { getErrorMessage } from '@shared/api/errorMessage';
import { Button } from '@shared/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@shared/ui/dialog';

import { useDeleteBanner } from '../api/queries';

interface DeleteBannerDialogProps {
    banner: AdminBanner | null;
    /** 확인 문구에 보일 연결 이벤트 제목 */
    eventTitle: string;
    onOpenChange: (open: boolean) => void;
    /** 삭제 완료 후 호출 — 삭제한 행의 버튼이 사라져 포커스 복귀 대상을 잃으므로 안정된 요소로 옮긴다 */
    onDeleted?: () => void;
}

/** 배너 삭제 확인 — banner가 있을 때만 열린다 */
export function DeleteBannerDialog({
    banner,
    eventTitle,
    onOpenChange,
    onDeleted,
}: DeleteBannerDialogProps) {
    const deleteBanner = useDeleteBanner();

    const submit = () => {
        if (!banner) return;
        deleteBanner.mutate(banner.id, {
            onSuccess: () => {
                toast.success('배너를 삭제했습니다');
                onOpenChange(false);
                // 다이얼로그가 닫힌 뒤 실행해야 포커스 복귀와 겹치지 않는다
                setTimeout(() => onDeleted?.(), 0);
            },
        });
    };

    return (
        <Dialog
            open={banner !== null}
            onOpenChange={(next) => {
                onOpenChange(next);
                if (!next) deleteBanner.reset();
            }}
        >
            <DialogContent
                showCloseButton={false}
                className="bg-surface-page border-border-default gap-6 rounded-2xl border p-8 shadow-md ring-0 sm:max-w-140"
            >
                <DialogHeader className="gap-2">
                    <DialogTitle className="text-title-3 text-fg-primary">배너 삭제</DialogTitle>
                    <DialogDescription className="text-body-sm text-fg-secondary">
                        ‘{eventTitle}’ 배너를 삭제합니다. 삭제한 배너는 되돌릴 수 없습니다.
                    </DialogDescription>
                </DialogHeader>

                {deleteBanner.isError && (
                    <p role="alert" className="text-semantic-error-strong text-body-sm">
                        {getErrorMessage(
                            deleteBanner.error,
                            '배너를 삭제하지 못했습니다. 다시 시도해주세요.',
                        )}
                    </p>
                )}

                <div className="flex gap-4">
                    <DialogClose asChild>
                        <Button variant="secondary" className="h-10 flex-1">
                            취소
                        </Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        className="h-10 flex-1"
                        disabled={deleteBanner.isPending}
                        onClick={submit}
                    >
                        {deleteBanner.isPending ? '삭제 중…' : '삭제'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
