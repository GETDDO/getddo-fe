import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import type { EventWriteRequest } from '@entities/event';

import { EVENT_TYPE_LABEL, MEMBERSHIP_LABEL, useAdminEvent } from '@entities/event';
import { useCreateEvent, useUpdateEvent } from '@features/manageEvent';
import { kstInputToUtcIso, utcIsoToKstInput } from '@shared/lib/date';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';

const FIELD_LABEL = 'text-body-bold text-fg-primary';
const FIELD_ERROR = 'text-destructive text-caption';
const INPUT_LIKE =
    'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:ring-3 disabled:opacity-50';

const prizeSchema = z.object({
    rank: z.coerce.number().int().min(1, '등수는 1 이상이어야 합니다'),
    name: z.string().trim().min(1, '경품명을 입력하세요'),
    winnerCount: z.coerce.number().int().min(1, '당첨 인원은 1명 이상이어야 합니다'),
    description: z.string(),
    imageKey: z.string(),
});

// 관리자 입력 시각은 KST로 해석한다 — datetime-local 값을 그대로 받고 제출 시 UTC로 변환 (spec 공통 시간 기준)
const formSchema = z
    .object({
        title: z.string().trim().min(1, '이벤트 이름을 입력하세요'),
        description: z.string().trim().min(1, '설명을 입력하세요'),
        imageKey: z.string(),
        eventType: z.enum(['NO_TICKET', 'TICKET']),
        weightingEnabled: z.boolean(),
        // 상한 없음은 빈 입력으로 둔다 (월말 소진용 이벤트)
        maxTicketsPerUser: z.string(),
        membershipRule: z.enum(['excellent', 'vip', 'vvip']),
        startsAt: z.string().min(1, '시작 시각을 입력하세요'),
        endsAt: z.string().min(1, '마감 시각을 입력하세요'),
        prizes: z
            .array(prizeSchema)
            .min(1, '경품은 최소 1개 필요합니다')
            .refine(
                (prizes) => new Set(prizes.map((p) => p.rank)).size === prizes.length,
                '같은 등수에 경품이 중복됐습니다',
            ),
    })
    .refine((v) => v.endsAt > v.startsAt, {
        message: '마감 시각은 시작 시각 이후여야 합니다',
        path: ['endsAt'],
    });

// coerce를 쓰는 경품 숫자 필드 때문에 입력(z.input)과 출력(z.output) 타입이 다르다 — RHF는 입력 기준으로 폼을 잡는다
type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

const toBody = (v: FormValues): EventWriteRequest => ({
    title: v.title.trim(),
    description: v.description.trim(),
    imageKey: v.imageKey.trim() || null,
    eventType: v.eventType,
    weightingEnabled: v.eventType === 'TICKET' && v.weightingEnabled,
    maxTicketsPerUser:
        v.eventType === 'TICKET' && v.weightingEnabled && v.maxTicketsPerUser.trim() !== ''
            ? Number(v.maxTicketsPerUser)
            : null,
    membershipRule: v.membershipRule,
    startsAt: kstInputToUtcIso(v.startsAt),
    endsAt: kstInputToUtcIso(v.endsAt),
    prizes: v.prizes.map((p) => ({
        rank: p.rank,
        name: p.name.trim(),
        winnerCount: p.winnerCount,
        description: p.description.trim() || null,
        imageKey: p.imageKey.trim() || null,
    })),
});

const MEMBERSHIP_OPTIONS = (
    Object.entries(MEMBERSHIP_LABEL) as [FormValues['membershipRule'], string][]
).map(([value, label]) => ({ value, label: `${label} 이상` }));

export function AdminEventFormPage() {
    const { eventId } = useParams();
    const isEdit = Boolean(eventId);
    const navigate = useNavigate();
    const { data: event, isPending, isError } = useAdminEvent(eventId ?? '');
    const createEvent = useCreateEvent();
    const updateEvent = useUpdateEvent();
    const mutation = isEdit ? updateEvent : createEvent;

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<FormInput, undefined, FormValues>({
        resolver: zodResolver(formSchema),
        values: event
            ? {
                  title: event.title,
                  description: event.description,
                  imageKey: event.imageKey ?? '',
                  eventType: event.eventType,
                  weightingEnabled: event.weightingEnabled,
                  maxTicketsPerUser:
                      event.maxTicketsPerUser === null ? '' : String(event.maxTicketsPerUser),
                  membershipRule: event.membershipRule,
                  startsAt: utcIsoToKstInput(event.startsAt),
                  endsAt: utcIsoToKstInput(event.endsAt),
                  prizes: event.prizes.map((p) => ({
                      rank: p.rank,
                      name: p.name,
                      winnerCount: p.winnerCount,
                      description: p.description ?? '',
                      // 응답은 imageUrl, 쓰기 요청은 imageKey라 초기값은 imageUrl에서 가져온다 (spec 초안 비대칭)
                      imageKey: p.imageUrl ?? '',
                  })),
              }
            : undefined,
        defaultValues: {
            title: '',
            description: '',
            imageKey: '',
            eventType: 'TICKET',
            weightingEnabled: true,
            maxTicketsPerUser: '5',
            membershipRule: 'excellent',
            startsAt: '',
            endsAt: '',
            prizes: [{ rank: 1, name: '', winnerCount: 1, description: '', imageKey: '' }],
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'prizes' });
    const eventType = useWatch({ control, name: 'eventType' });
    const weightingEnabled = useWatch({ control, name: 'weightingEnabled' });
    const showTicketOptions = eventType === 'TICKET';

    if (isEdit && isPending) {
        return <p className="text-body-sm text-fg-tertiary pb-10">불러오는 중…</p>;
    }
    if (isEdit && (isError || !event)) {
        return (
            <div className="flex flex-col gap-4 pb-10">
                <p className="text-destructive text-body-sm">이벤트를 불러오지 못했습니다.</p>
                <Button
                    variant="outline"
                    className="w-fit"
                    onClick={() => void navigate('/admin/events')}
                >
                    목록으로
                </Button>
            </div>
        );
    }

    const submit = (e: React.FormEvent) => {
        void handleSubmit((values) => {
            const body = toBody(values);
            const onSuccess = () => {
                toast.success(isEdit ? '이벤트를 수정했습니다' : '이벤트를 등록했습니다');
                void navigate('/admin/events');
            };
            if (isEdit && eventId) {
                updateEvent.mutate({ eventId, body }, { onSuccess });
            } else {
                createEvent.mutate(body, { onSuccess });
            }
        })(e);
    };

    return (
        <form onSubmit={submit} className="flex max-w-200 flex-col gap-6 pr-10 pb-10">
            <div className="flex items-center gap-3">
                <Button type="button" variant="outline" size="sm" onClick={() => void navigate(-1)}>
                    ← 뒤로
                </Button>
                <h2 className="text-title-3 text-fg-primary">
                    {isEdit ? '이벤트 수정' : '새 이벤트 등록'}
                </h2>
            </div>

            <section className="bg-surface-page border-border-default flex flex-col gap-4 rounded-2xl border p-6">
                <h3 className={FIELD_LABEL}>기본 정보</h3>

                <div className="flex flex-col gap-2">
                    <label htmlFor="event-title" className={FIELD_LABEL}>
                        이벤트 이름
                    </label>
                    <Input id="event-title" {...register('title')} />
                    {errors.title && <p className={FIELD_ERROR}>{errors.title.message}</p>}
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="event-description" className={FIELD_LABEL}>
                        설명
                    </label>
                    <textarea
                        id="event-description"
                        rows={3}
                        className={INPUT_LIKE}
                        {...register('description')}
                    />
                    {errors.description && (
                        <p className={FIELD_ERROR}>{errors.description.message}</p>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="event-image-key" className={FIELD_LABEL}>
                        이미지 키 (선택)
                    </label>
                    <Input
                        id="event-image-key"
                        placeholder="이미지 업로드 계약 확정 전까지 키를 직접 입력"
                        {...register('imageKey')}
                    />
                </div>
            </section>

            <section className="bg-surface-page border-border-default flex flex-col gap-4 rounded-2xl border p-6">
                <h3 className={FIELD_LABEL}>응모 조건</h3>

                <div className="flex flex-wrap gap-4">
                    <div className="flex flex-col gap-2">
                        <label className={FIELD_LABEL}>이벤트 유형</label>
                        <Controller
                            control={control}
                            name="eventType"
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-40" aria-label="이벤트 유형">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(EVENT_TYPE_LABEL).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className={FIELD_LABEL}>최소 멤버십 등급</label>
                        <Controller
                            control={control}
                            name="membershipRule"
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-36" aria-label="최소 멤버십 등급">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MEMBERSHIP_OPTIONS.map(({ value, label }) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </div>

                {showTicketOptions && (
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex items-center gap-2">
                            <input
                                id="event-weighting"
                                type="checkbox"
                                className="size-4"
                                {...register('weightingEnabled')}
                            />
                            <label
                                htmlFor="event-weighting"
                                className="text-body-sm text-fg-primary"
                            >
                                가중치 응모 사용
                            </label>
                        </div>
                        {weightingEnabled && (
                            <div className="flex flex-col gap-2">
                                <label htmlFor="event-max-tickets" className={FIELD_LABEL}>
                                    1인 최대 응모권
                                </label>
                                <Input
                                    id="event-max-tickets"
                                    type="number"
                                    min={1}
                                    className="w-36"
                                    placeholder="비우면 상한 없음"
                                    {...register('maxTicketsPerUser')}
                                />
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-wrap gap-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="event-starts-at" className={FIELD_LABEL}>
                            응모 시작 (KST)
                        </label>
                        <Input
                            id="event-starts-at"
                            type="datetime-local"
                            className="w-56"
                            // spec: 등록된 이벤트의 시작 시각은 현재 설정보다 앞당길 수 없다
                            min={isEdit && event ? utcIsoToKstInput(event.startsAt) : undefined}
                            {...register('startsAt')}
                        />
                        {errors.startsAt && (
                            <p className={FIELD_ERROR}>{errors.startsAt.message}</p>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="event-ends-at" className={FIELD_LABEL}>
                            응모 마감 (KST)
                        </label>
                        <Input
                            id="event-ends-at"
                            type="datetime-local"
                            className="w-56"
                            {...register('endsAt')}
                        />
                        {errors.endsAt && <p className={FIELD_ERROR}>{errors.endsAt.message}</p>}
                    </div>
                </div>
            </section>

            <section className="bg-surface-page border-border-default flex flex-col gap-4 rounded-2xl border p-6">
                <div className="flex items-center justify-between">
                    <h3 className={FIELD_LABEL}>경품 ({fields.length}종)</h3>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            append({
                                rank: fields.length + 1,
                                name: '',
                                winnerCount: 1,
                                description: '',
                                imageKey: '',
                            })
                        }
                    >
                        경품 추가
                    </Button>
                </div>
                <p className="text-caption text-fg-tertiary">
                    등수마다 한 종류의 경품만 등록할 수 있습니다.
                </p>

                {fields.map((field, index) => (
                    <div
                        key={field.id}
                        className="border-border-default flex flex-col gap-3 rounded-xl border p-4"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-body-bold text-fg-primary">경품 {index + 1}</span>
                            {fields.length > 1 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => remove(index)}
                                >
                                    제거
                                </Button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <div className="flex w-24 flex-col gap-1">
                                <label className="text-caption text-fg-tertiary">등수</label>
                                <Input
                                    type="number"
                                    min={1}
                                    {...register(`prizes.${index}.rank`)}
                                />
                            </div>
                            <div className="flex min-w-48 flex-1 flex-col gap-1">
                                <label className="text-caption text-fg-tertiary">경품명</label>
                                <Input {...register(`prizes.${index}.name`)} />
                            </div>
                            <div className="flex w-28 flex-col gap-1">
                                <label className="text-caption text-fg-tertiary">당첨 인원</label>
                                <Input
                                    type="number"
                                    min={1}
                                    {...register(`prizes.${index}.winnerCount`)}
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <div className="flex min-w-48 flex-1 flex-col gap-1">
                                <label className="text-caption text-fg-tertiary">설명 (선택)</label>
                                <Input {...register(`prizes.${index}.description`)} />
                            </div>
                            <div className="flex min-w-48 flex-1 flex-col gap-1">
                                <label className="text-caption text-fg-tertiary">
                                    이미지 키 (선택)
                                </label>
                                <Input {...register(`prizes.${index}.imageKey`)} />
                            </div>
                        </div>
                        {(errors.prizes?.[index]?.rank ||
                            errors.prizes?.[index]?.name ||
                            errors.prizes?.[index]?.winnerCount) && (
                            <p className={FIELD_ERROR}>
                                {errors.prizes[index]?.rank?.message ??
                                    errors.prizes[index]?.name?.message ??
                                    errors.prizes[index]?.winnerCount?.message}
                            </p>
                        )}
                    </div>
                ))}
                {errors.prizes?.root && <p className={FIELD_ERROR}>{errors.prizes.root.message}</p>}
                {typeof errors.prizes?.message === 'string' && (
                    <p className={FIELD_ERROR}>{errors.prizes.message}</p>
                )}
            </section>

            {mutation.isError && (
                <p className={cn(FIELD_ERROR, 'text-body-sm')}>
                    저장에 실패했습니다. 입력값과 이벤트 상태를 확인한 뒤 다시 시도해주세요.
                </p>
            )}

            <div className="flex gap-4">
                <Button
                    type="button"
                    variant="outline"
                    className="h-10 flex-1"
                    onClick={() => void navigate(-1)}
                >
                    취소
                </Button>
                <Button type="submit" className="h-10 flex-1" disabled={mutation.isPending}>
                    {mutation.isPending ? '저장 중…' : isEdit ? '수정 저장' : '이벤트 등록'}
                </Button>
            </div>
        </form>
    );
}
