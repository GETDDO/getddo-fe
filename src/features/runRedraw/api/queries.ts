import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cancellationRedrawsApiPath, DRAWS_KEY, drawRunSchema } from '@entities/drawResult';
import {
    drawPublicationApiPath,
    publicationUpdateResultSchema,
    RESULT_CHANGES_KEY,
} from '@entities/winner';
import { apiClient } from '@shared/api/client';
import { envelopeSchema } from '@shared/api/envelopeSchema';

// AD09 — 취소에 연결된 재추첨 실행의 시작·재개. 이미 확정된 실행은 서버가 저장 결과를 돌려준다.
// 취소·재추첨 쌍의 멱등은 취소 ID로 서버가 보장해 별도 멱등 헤더가 없다 (common.md 중복 요청 표)
export function useStartRedraw() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (cancellationId: string) => {
            const { data } = await apiClient.post<unknown>(
                cancellationRedrawsApiPath(cancellationId),
            );
            return envelopeSchema(drawRunSchema).parse(data).data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: DRAWS_KEY });
        },
    });
}

interface PublishRedrawInput {
    drawId: string;
    reason: string;
}

// AD06 — 최초 발표 이후 확정된 재추첨 결과를 공개 명단에 반영한다.
// 최초 공개 전 재추첨의 확인 API는 후속 계약이라 이 훅을 최초 공개 전에 호출하지 않는다 (호출부가 막는다)
export function usePublishRedraw() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ drawId, reason }: PublishRedrawInput) => {
            const { data } = await apiClient.post<unknown>(drawPublicationApiPath(drawId), {
                reason,
            });
            return envelopeSchema(publicationUpdateResultSchema).parse(data).data;
        },
        onSuccess: () => {
            // 결과의 공개 이력(wasPublished)과 변경 이력이 함께 바뀐다
            void queryClient.invalidateQueries({ queryKey: DRAWS_KEY });
            void queryClient.invalidateQueries({ queryKey: RESULT_CHANGES_KEY });
        },
    });
}
