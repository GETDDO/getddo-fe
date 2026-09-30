import { z } from 'zod';

export const eventStatusSchema = z.enum(['upcoming', 'open', 'closed', 'drawn']);

// 서버 응답 스키마 — startsAt/endsAt은 UTC ISO 8601 문자열, 화면 표시 시 shared/lib/date의 KST 변환 사용
export const eventSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    // 목록 카드 썸네일 (가로형)
    bannerImageUrl: z.string().nullable(),
    // 상세 화면 본문 이미지 — 이벤트마다 디자이너가 만드는 세로로 긴 한 장. 썸네일과 비율·용도가 달라 분리했다.
    // TODO: 필드명·형식·용량 제한은 백엔드와 미합의 (docs/CONTEXT.md "배너 이미지 형식·용량 제한 — 담당자 확정 대기")
    detailImageUrl: z.string().nullable().optional(),
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
    status: eventStatusSchema,
    // 이벤트 목록 상단 '추천 이벤트' 노출 여부 — 운영자가 고르는 값이라 계산으로 만들 수 없다.
    // TODO: 추천 선정 방식은 백엔드와 미합의 (getddo-spec 02-domain/event.md에 정의 없음)
    isRecommended: z.boolean().optional(),
    // 정해진 시간에만 열리는 한정 굿즈 래플 — 타임래플 화면에만 노출하고 이벤트 목록에서는 뺀다.
    // TODO: 이벤트 유형 구분 방식은 백엔드와 미합의 (getddo-spec 02-domain/event.md에 유형 정의 없음)
    isTimeRaffle: z.boolean().optional(),
    // 타임래플 상세 화면의 안내 문구 — 운영자가 이벤트마다 작성하는 값이라 계산으로 만들 수 없다.
    // TODO: 필드 구성은 백엔드와 미합의. 없으면 상세 화면이 기본값으로 대체한다.
    raffleDetail: z
        .object({
            paragraphs: z.array(z.string()),
            prizeComposition: z.string(),
            shippingSchedule: z.string(),
            membershipNote: z.string(),
        })
        .optional(),
    requiredTickets: z.number().int().nonnegative(),
    // 카드 태그 칩 (예: "멤버십 혜택") — 없으면 칩 미노출
    tags: z.array(z.string()).optional(),
    prizeName: z.string(),
    winnerCount: z.number().int().positive(),
    // 실시간 응모 현황 — CONTEXT.md: 당첨 확률은 노출 금지, 아래 지표까지만 표시 가능
    participantCount: z.number().int().nonnegative().nullable().optional(),
    usedTicketCount: z.number().int().nonnegative().nullable().optional(),
    myEntryCount: z.number().int().nonnegative().nullable().optional(),
});

export type EventStatus = z.infer<typeof eventStatusSchema>;
export type Event = z.infer<typeof eventSchema>;
