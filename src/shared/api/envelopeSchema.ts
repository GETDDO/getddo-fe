import { z } from 'zod';

// spec 공통 계약의 성공 응답 봉투 — data만 꺼내는 최소 검증 (code/message는 소비하지 않는다)
export const envelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({ success: z.literal(true), data: dataSchema });
