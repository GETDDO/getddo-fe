import type { Prize } from '@entities/drawResult';

import { useSessionStore } from '@entities/user';
import { Button } from '@shared/ui/button';

import winnerMascot from '../assets/winner-mascot.png';

/**
 * 당첨 배너.
 *
 * 당첨 여부는 본인 결과 조회(E09)가 판정한 값만 쓴다. 공개 명단에서 뒷자리가 맞았다는 것은
 * 같은 뒷자리를 가진 다른 사람일 수 있어 '내가 당첨됐다'의 근거가 되지 못한다.
 */
export function WinnerBanner({ prize }: { prize: Prize | null }) {
    const userName = useSessionStore((state) => state.user?.name);

    return (
        <section className="bg-ticket-accent flex flex-col gap-6 rounded-2xl p-6 lg:flex-row lg:items-center">
            {/* 축하 연출용 장식이라 읽어 줄 내용이 없다 — 등수·경품은 옆 글에서 그대로 읽힌다 */}
            <img src={winnerMascot} alt="" className="size-42 shrink-0 object-contain" />

            <div className="flex min-w-0 flex-1 flex-col gap-2">
                {prize && (
                    <span className="bg-action-neutral text-fg-on-brand text-caption w-fit rounded-full px-3 py-1.5">
                        {prize.rank}등 당첨
                    </span>
                )}
                <h3 className="text-title-1 text-fg-primary">
                    축하해요{userName ? `, ${userName}님` : ''}!
                </h3>
                <p className="text-body text-fg-secondary">
                    {prize ? `${prize.name}에 당첨됐어요. ` : ''}
                    경품 수령 안내는 가입하신 연락처로 따로 보내 드려요.
                </p>
            </div>

            {/*
             * TODO: 배송 정보 입력은 API 계약이 없다 (getddo-spec 05-api에 수령 정보 엔드포인트 없음).
             * 시안의 '입력 마감 D-7' 칩도 기한을 내려 주는 필드가 없어 임의로 적지 않고 비워 둔다.
             */}
            <Button size="lg" disabled className="shrink-0 lg:w-55">
                배송 정보 입력하기
            </Button>
        </section>
    );
}
