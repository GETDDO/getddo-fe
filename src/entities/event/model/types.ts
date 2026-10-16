import { z } from 'zod';

import { eventTypeSchema, membershipRuleSchema } from './adminTypes';

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
    // 발표 예정 시각(publicationScheduledAt)은 ADR-022 수동 공개 전환으로 계약에서 제거됐다 —
    // 서버가 내려주지 않으므로 화면도 '발표 대기' 상태만 보인다 (getddo-spec 05-api/event.md)
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
    // spec EventSummary의 응모 규칙 필드 — 응모 요청(tickets 맵)의 허용 조합을 이 값으로 판정한다.
    // 미사용은 NO_TICKET, 브론즈 1장 고정은 TICKET+weightingEnabled:false, 일반 가중치는 누적 상한이 있는
    // weightingEnabled:true, 월말 소진용은 maxTicketsPerUser:null 조합이다 (getddo-spec 05-api/event.md)
    eventType: eventTypeSchema,
    weightingEnabled: z.boolean(),
    maxTicketsPerUser: z.number().int().nullable(),
    membershipRule: membershipRuleSchema,
    // 레거시 표시용 필드 — 목록 섹션 분리·카드 표시에 쓴다. 응모 규칙 판정은 위 네 필드를 따른다.
    // TODO: 응모권 필요 여부 표시를 eventType으로 옮기는 전환은 별도 작업
    requiredTickets: z.number().int().nonnegative(),
    // 카드 태그 칩 (예: "멤버십 혜택") — 없으면 칩 미노출
    tags: z.array(z.string()).optional(),
    prizeName: z.string(),
    winnerCount: z.number().int().positive(),
    // 응모 현황(응모자 수·차감 합계)은 E03 전용 조회(entities/entry의 useEntryStatistics)로 받는다 — ADR-0007
    myEntryCount: z.number().int().nonnegative().nullable().optional(),
    // 내가 이 이벤트에 지금까지 쓴 응모권 수 — 추가 응모로 한도(ADR-010)까지 얼마나 남았는지 계산하는 값.
    // 한 번에 여러 장을 쓸 수 있어서 myEntryCount × requiredTickets로는 실제 사용량을 알 수 없다.
    // TODO: 필드명·제공 여부는 백엔드와 미합의. 없으면 myEntryCount × requiredTickets로 근사한다.
    myTicketCount: z.number().int().nonnegative().nullable().optional(),
});

export type EventStatus = z.infer<typeof eventStatusSchema>;
export type Event = z.infer<typeof eventSchema>;
