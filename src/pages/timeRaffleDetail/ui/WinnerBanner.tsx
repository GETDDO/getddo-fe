import { Button } from '@shared/ui/button';

import winnerMascot from '../assets/winner-mascot.png';

interface WinnerBannerProps {
    /** 조회로 찾은 당첨자의 마스킹된 이름 */
    maskedName: string;
    rank: number;
    prizeName: string;
    onReset: () => void;
}

/**
 * 당첨 조회에 성공했을 때의 머리 배너.
 *
 * 명단에서 자기 줄을 눈으로 찾게 하지 않고, 등수와 경품을 먼저 크게 알려 준다.
 * 조회는 뒷자리로 하므로 같은 뒷자리를 가진 다른 사람일 수 있다 — '다시 조회'를 늘 함께 둔다.
 */
export function WinnerBanner({ maskedName, rank, prizeName, onReset }: WinnerBannerProps) {
    return (
        <section className="bg-ticket-accent flex flex-col gap-6 rounded-2xl p-6 lg:flex-row lg:items-center">
            {/* 축하 연출용 장식이라 읽어 줄 내용이 없다 — 등수·경품은 옆 글에서 그대로 읽힌다 */}
            <img src={winnerMascot} alt="" className="size-42 shrink-0 object-contain" />

            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="bg-action-neutral text-fg-on-brand text-caption w-fit rounded-full px-3 py-1.5">
                    {rank}등 당첨
                </span>
                <h3 className="text-title-1 text-fg-primary">축하해요, {maskedName}님!</h3>
                <p className="text-body text-fg-secondary">
                    {prizeName}에 당첨됐어요. 경품 수령 안내는 가입하신 연락처로 따로 보내 드려요.
                </p>
            </div>

            <div className="flex shrink-0 flex-col items-stretch gap-2 lg:w-55">
                {/*
                 * TODO: 배송 정보 입력은 API 계약이 없다 (getddo-spec 05-api에 수령 정보 엔드포인트 없음).
                 * 시안의 '입력 마감 D-7' 칩도 기한을 내려 주는 필드가 없어 임의로 적지 않고 비워 둔다.
                 */}
                <Button size="lg" disabled>
                    배송 정보 입력하기
                </Button>
                <Button variant="ghost" size="sm" onClick={onReset}>
                    다른 번호로 다시 조회
                </Button>
            </div>
        </section>
    );
}
