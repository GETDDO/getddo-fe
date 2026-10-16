import { Ticket } from 'lucide-react';

/**
 * 미션 보상 — "🎟 +N" (응모권은 아이콘으로). 카드 설명 줄과 풀이 모달 정보 줄 앞에 둔다.
 * 종류 칩·마감 칩과 한 줄에 섞으면 칩·글자·칩이 번갈아 줄이 끊겨 보여 보상은 설명 쪽으로 뺐다.
 * received: 받은 뒤 "받았어요"로, muted: 흐린 글자(완료·종료 카드), small: 모달 정보 줄처럼 12px 줄에 맞출 때
 */
export function MissionReward({
    count,
    received = false,
    muted = false,
    small = false,
}: {
    count: number;
    received?: boolean;
    muted?: boolean;
    small?: boolean;
}) {
    return (
        <span
            className={`inline-flex shrink-0 items-center gap-1 ${small ? 'text-xs leading-[1.125rem] font-semibold' : 'text-body-sm-bold'} ${muted ? 'text-fg-tertiary' : 'text-fg-primary'}`}
        >
            <Ticket aria-hidden className={small ? 'size-3.5' : 'size-4'} />
            <span aria-hidden>
                +{count}
                {received && ' 받았어요'}
            </span>
            {/* 화면 읽기 프로그램에는 아이콘 대신 낱말로 읽어 준다 */}
            <span className="sr-only">
                보상 응모권 {count}장{received && ' 받음'}
            </span>
        </span>
    );
}
