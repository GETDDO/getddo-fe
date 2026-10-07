import { toast } from 'sonner';

import type { MissionSubmissionResult } from '@entities/mission';

import { useMissionDetail } from '@entities/mission';
import { QuizForm, SurveyForm } from '@features/submitMission';
import { formatKst } from '@shared/lib/date';
import { useVirtualClock } from '@shared/lib/virtualClock';
import { Button } from '@shared/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@shared/ui/dialog';

import { MissionKindReward } from './MissionKindReward';

const PERIOD_FORMAT: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };

/**
 * 설문·퀴즈 풀이 모달 — 미션 목록 위에서 바로 풀고 제출한다 (멘토링: 지금 분량이면 페이지 이동보다 모달).
 * 문항 수는 관리자가 정하므로 머리(제목·기간)는 고정하고 문항 영역만 스크롤한다.
 * 이번 제출로 막 완료되면 onRewarded로 받은 응모권 수를 올려 목록이 보상 모달을 띄운다
 */
export function MissionDialog({
    missionId,
    onClose,
    onRewarded,
}: {
    /** 연 미션 — null이면 닫힘 */
    missionId: string | null;
    onClose: () => void;
    onRewarded: (tickets: number) => void;
}) {
    return (
        <Dialog
            open={missionId !== null}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent className="bg-surface-elevated flex max-h-[85vh] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-xl">
                {/* 상세 조회는 미션을 열었을 때만 — 빈 id로 요청하지 않게 내용은 열린 동안에만 그린다 */}
                {missionId !== null && (
                    <MissionDialogBody
                        missionId={missionId}
                        onClose={onClose}
                        onRewarded={onRewarded}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

function MissionDialogBody({
    missionId,
    onClose,
    onRewarded,
}: {
    missionId: string;
    onClose: () => void;
    onRewarded: (tickets: number) => void;
}) {
    const { data: mission, isPending, isError } = useMissionDetail(missionId);
    // 기간 판정은 서버 몫 — 여기의 now 비교는 표시용 안내에만 쓴다 (시간 규칙)
    const now = useVirtualClock().now();

    if (isPending || isError || !mission) {
        return (
            <div className="flex flex-col gap-2 p-6">
                <DialogTitle>{isPending ? '불러오는 중…' : '미션을 불러오지 못했어요'}</DialogTitle>
                <DialogDescription>
                    {isPending ? '잠시만 기다려 주세요.' : '잠시 후 다시 시도해 주세요.'}
                </DialogDescription>
            </div>
        );
    }

    const notYetOpen = now < new Date(mission.startsAt);
    const ended = now >= new Date(mission.endsAt);

    const handleCompleted = (result: MissionSubmissionResult, isNewSubmission: boolean) => {
        // 보상 모달은 이번 제출로 막 완료됐을 때(201)만 — 재제출 재생(200)은 안내만 하고 닫는다
        if (isNewSubmission) {
            onRewarded(result.reward?.ticketCount ?? mission.rewardTicketCount);
        } else {
            toast.info('이미 완료한 미션이에요.');
            onClose();
        }
    };

    return (
        <>
            <header className="flex shrink-0 flex-col gap-2 border-b-0 px-6 pt-6 pr-12 pb-4">
                <MissionKindReward
                    missionType={mission.missionType}
                    rewardTicketCount={mission.rewardTicketCount}
                    muted={mission.completed}
                />
                {/* 글자 크기는 text-xl로 — 커스텀 타이포 토큰은 공용 cn이 글자색과 같은 묶음으로 보고 지운다 */}
                <DialogTitle className="text-xl leading-7 font-semibold">
                    {mission.title}
                </DialogTitle>
                <DialogDescription className="text-sm leading-[1.375rem]">
                    {mission.description}
                </DialogDescription>
                <p className="text-caption text-fg-tertiary">
                    {formatKst(mission.startsAt, PERIOD_FORMAT)} ~{' '}
                    {formatKst(mission.endsAt, PERIOD_FORMAT)}
                </p>
            </header>
            {/* 문항이 많아도 모달 높이(화면의 85%) 안에서 문항 영역만 스크롤한다 */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
                {mission.completed || notYetOpen || ended ? (
                    <div className="flex flex-col items-center gap-4 py-6 text-center">
                        <p className="text-body-bold text-fg-primary">
                            {mission.completed
                                ? '이미 완료한 미션이에요'
                                : notYetOpen
                                  ? '아직 시작하지 않은 미션이에요'
                                  : '종료된 미션이에요'}
                        </p>
                        <p className="text-body-sm text-fg-secondary">
                            {mission.completed
                                ? '미션은 한 번만 완료할 수 있어요. 다른 미션에 도전해 보세요.'
                                : notYetOpen
                                  ? `${formatKst(mission.startsAt, PERIOD_FORMAT)}부터 참여할 수 있어요.`
                                  : '운영 기간이 지나 제출할 수 없어요.'}
                        </p>
                        <DialogClose asChild>
                            <Button variant="secondary">닫기</Button>
                        </DialogClose>
                    </div>
                ) : mission.missionType === 'QUIZ' ? (
                    <QuizForm mission={mission} onCompleted={handleCompleted} />
                ) : (
                    <SurveyForm mission={mission} onCompleted={handleCompleted} />
                )}
            </div>
        </>
    );
}
