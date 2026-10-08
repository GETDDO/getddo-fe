import { z } from 'zod';

// AB01~AB05 응답의 AdminBanner — getddo-spec 05-api/banner.md 초안(검토 대기).
// spec의 createdBy는 관리자 이벤트 응답에서 제거한 방침(#50)에 맞춰 싣지 않는다
export const adminBannerSchema = z.object({
    id: z.string(),
    eventId: z.string(),
    imageUrl: z.string(),
    imageKey: z.string(),
    displayOrder: z.number().int().min(0),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
});

export type AdminBanner = z.infer<typeof adminBannerSchema>;

// AB02/AB03 요청 본문 — BannerWrite. 응답과 달리 쓰기용이라 Zod 검증 없이 타입만 둔다
export interface BannerWrite {
    eventId: string;
    imageKey: string;
    displayOrder: number;
}
