import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import type { AdminBanner } from '@entities/banner';

import { BANNER_IMAGE_KEY_MAX_LENGTH, BANNER_IMAGE_TEMP_POLICY } from '@entities/banner';
import { Button } from '@shared/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@shared/ui/dialog';
import { Input } from '@shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';

import { useCreateBanner, useUpdateBanner } from '../api/queries';
import { bannerErrorMessage } from '../lib/errorMessage';

const bannerFormSchema = z.object({
    eventId: z.string().min(1, '연결할 이벤트를 선택하세요'),
    imageKey: z
        .string()
        .trim()
        .min(1, '이미지 키를 입력하세요')
        .max(
            BANNER_IMAGE_KEY_MAX_LENGTH,
            `이미지 키는 ${BANNER_IMAGE_KEY_MAX_LENGTH}자 이하입니다`,
        ),
});

type BannerFormValues = z.infer<typeof bannerFormSchema>;

export interface BannerEventOption {
    id: string;
    title: string;
}

interface BannerFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** 수정 대상 — 없으면 등록이다 */
    banner: AdminBanner | null;
    events: BannerEventOption[];
    /** 등록 시 보낼 노출 순서 — 목록 맨 뒤에 붙이고, 이후 순서는 목록에서 바꾼다 */
    nextDisplayOrder: number;
}

function BannerForm({
    banner,
    events,
    nextDisplayOrder,
    onDone,
}: Omit<BannerFormDialogProps, 'open' | 'onOpenChange'> & { onDone: () => void }) {
    const isEdit = banner !== null;
    const createBanner = useCreateBanner();
    const updateBanner = useUpdateBanner();
    const mutation = isEdit ? updateBanner : createBanner;

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<BannerFormValues>({
        resolver: zodResolver(bannerFormSchema),
        defaultValues: { eventId: banner?.eventId ?? '', imageKey: banner?.imageKey ?? '' },
    });

    const onSubmit = handleSubmit((values) => {
        const body = {
            eventId: values.eventId,
            imageKey: values.imageKey,
            displayOrder: banner?.displayOrder ?? nextDisplayOrder,
        };
        const options = {
            onSuccess: () => {
                toast.success(isEdit ? '배너를 수정했습니다' : '배너를 등록했습니다');
                onDone();
            },
        };
        if (banner) updateBanner.mutate({ bannerId: banner.id, body }, options);
        else createBanner.mutate(body, options);
    });

    const { formats, maxMegabytes } = BANNER_IMAGE_TEMP_POLICY;

    return (
        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-6" noValidate>
            <div className="flex flex-col gap-2">
                <label htmlFor="banner-event" className="text-body-bold text-fg-primary">
                    연결 이벤트
                </label>
                <Controller
                    control={control}
                    name="eventId"
                    render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger
                                id="banner-event"
                                className="w-full"
                                aria-invalid={Boolean(errors.eventId)}
                            >
                                <SelectValue placeholder="이벤트를 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                                {events.map((event) => (
                                    <SelectItem key={event.id} value={event.id}>
                                        {event.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.eventId && (
                    <p className="text-destructive text-caption">{errors.eventId.message}</p>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="banner-image-key" className="text-body-bold text-fg-primary">
                    이미지 키
                </label>
                <Input
                    id="banner-image-key"
                    placeholder="이미지 업로드 계약 확정 전까지 키를 직접 입력"
                    aria-invalid={Boolean(errors.imageKey)}
                    {...register('imageKey')}
                />
                {errors.imageKey && (
                    <p className="text-destructive text-caption">{errors.imageKey.message}</p>
                )}
                {/* 확정된 정책처럼 보이지 않도록 임시 기준임을 함께 밝힌다 */}
                <p className="text-fg-tertiary text-caption">
                    허용 형식·용량 기준은 담당자 확정 전입니다. 임시 안내: {formats.join('·')},
                    파일당 {maxMegabytes}MB 이하
                </p>
            </div>

            {mutation.isError && (
                <p role="alert" className="text-destructive text-body-sm">
                    {bannerErrorMessage(
                        mutation.error,
                        `배너를 ${isEdit ? '수정' : '등록'}하지 못했습니다. 다시 시도해주세요.`,
                    )}
                </p>
            )}

            <div className="flex gap-4">
                <DialogClose asChild>
                    <Button variant="secondary" type="button" className="h-10 flex-1">
                        취소
                    </Button>
                </DialogClose>
                <Button type="submit" className="h-10 flex-1" disabled={mutation.isPending}>
                    {mutation.isPending ? '저장 중…' : isEdit ? '수정' : '등록'}
                </Button>
            </div>
        </form>
    );
}

/** 배너 등록·수정 다이얼로그 — 열릴 때마다 폼이 새로 마운트되어 입력값과 오류가 초기화된다 */
export function BannerFormDialog({
    open,
    onOpenChange,
    banner,
    events,
    nextDisplayOrder,
}: BannerFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="bg-surface-page border-border-default gap-6 rounded-2xl border p-8 shadow-md ring-0 sm:max-w-140"
            >
                <DialogHeader className="gap-2">
                    <DialogTitle className="text-title-3 text-fg-primary">
                        {banner ? '배너 수정' : '배너 등록'}
                    </DialogTitle>
                    <DialogDescription className="text-body-sm text-fg-secondary">
                        배너를 선택하면 연결한 이벤트 화면으로 이동합니다.
                    </DialogDescription>
                </DialogHeader>
                <BannerForm
                    banner={banner}
                    events={events}
                    nextDisplayOrder={nextDisplayOrder}
                    onDone={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
