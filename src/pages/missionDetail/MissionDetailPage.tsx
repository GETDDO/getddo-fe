import { AnimatePresence, MotionConfig } from 'framer-motion';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import type { MissionSubmissionResult } from '@entities/mission';

import { MissionResultPanel, MissionRewardDialog, useMissionDetail } from '@entities/mission';
import { QuizForm } from '@features/submitQuiz';
import { SurveyForm } from '@features/submitSurvey';
import { formatKst } from '@shared/lib/date';
import { useVirtualClock } from '@shared/lib/virtualClock';
import { Button } from '@shared/ui/button';
import { StatusDot } from '@shared/ui/status-dot';

const CONTAINER = 'mx-auto w-full max-w-312 px-6';

const PERIOD_FORMAT: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
};

/** 미션 상세 — 문항을 풀어 제출하는 화면. 완료·기간 외 상태는 폼 대신 안내를 보여준다 */
export function MissionDetailPage() {
    const { missionId } = useParams<{ missionId: string }>();
    const { data: mission, isPending, isError } = useMissionDetail(missionId ?? '');
    // 방금 제출로 완료된 결과 — 상세 쿼리 무효화로 폼이 언마운트돼도 결과 화면이 살아있게 페이지가 들고 있는다
    const [submitted, setSubmitted] = useState<MissionSubmissionResult | null>(null);
    const [rewardOpen, setRewardOpen] = useState(false);
    // 기간 판정은 서버 몫 — 여기의 now 비교는 표시용 안내에만 쓴다 (시간 규칙)
    const now = useVirtualClock().now();

    if (isPending) {
        return (
            <main className={`${CONTAINER} text-body-sm text-fg-tertiary py-20`}>불러오는 중…</main>
        );
    }
    if (isError || !mission) {
        return (
            <main className={`${CONTAINER} flex flex-col items-start gap-3 py-20`}>
                <p className="text-body text-fg-primary">
                    {isError ? '미션 정보를 불러오지 못했습니다.' : '미션을 찾을 수 없어요.'}
                </p>
                <Link to="/missions" className="text-body-sm text-fg-brand">
                    미션 페이지로 돌아가기
                </Link>
            </main>
        );
    }

    const notYetOpen = now < new Date(mission.startsAt);
    const ended = now >= new Date(mission.endsAt);
    const rewardTickets = submitted?.reward?.ticketCount ?? mission.rewardTicketCount;

    const handleCompleted = (result: MissionSubmissionResult, isNewSubmission: boolean) => {
        setSubmitted(result);
        // 보상 모달은 이번 제출로 막 완료됐을 때(201)만 — 재제출 재생(200)에는 띄우지 않는다
        if (isNewSubmission) setRewardOpen(true);
    };

    return (
        <main className={`${CONTAINER} flex flex-col gap-8 pt-20 pb-28`}>
            <header className="flex flex-col gap-3">
                <StatusDot tone={mission.completed ? 'muted' : 'brand'}>
                    {mission.completed ? '참여 완료' : '참여 가능'}
                </StatusDot>
                <h1 className="text-title-1 text-fg-primary">{mission.title}</h1>
                <p className="text-body text-fg-secondary">{mission.description}</p>
                <p className="text-body-sm text-fg-tertiary">
                    {formatKst(mission.startsAt, PERIOD_FORMAT)} ~{' '}
                    {formatKst(mission.endsAt, PERIOD_FORMAT)} · 보상 응모권{' '}
                    {mission.rewardTicketCount}장
                </p>
            </header>

            {/* 운영체제의 동작 줄이기 설정을 켠 사용자에게는 폼↔결과 전환 효과를 끈다 */}
            <MotionConfig reducedMotion="user">
                <AnimatePresence mode="wait" initial={false}>
                    {submitted?.isCompleted ? (
                        <MissionResultPanel
                            key="result"
                            title={
                                mission.missionType === 'QUIZ'
                                    ? '정답이에요!'
                                    : '설문 참여가 완료됐어요'
                            }
                            tickets={rewardTickets}
                            receivedAt={submitted.receivedAt}
                        />
                    ) : mission.completed ? (
                        <section
                            key="completed"
                            className="bg-surface-page border-border-default flex flex-col items-center gap-4 rounded-2xl border p-8 text-center"
                        >
                            <h2 className="text-title-2 text-fg-primary">이미 완료한 미션이에요</h2>
                            <p className="text-body text-fg-secondary">
                                미션은 한 번만 완료할 수 있어요. 다른 미션에 도전해 보세요.
                            </p>
                            <Button asChild variant="primary">
                                <Link to="/missions">미션 목록으로</Link>
                            </Button>
                        </section>
                    ) : notYetOpen || ended ? (
                        <section
                            key="closed"
                            className="bg-surface-page border-border-default flex flex-col items-center gap-4 rounded-2xl border p-8 text-center"
                        >
                            <h2 className="text-title-2 text-fg-primary">
                                {notYetOpen ? '아직 시작하지 않은 미션이에요' : '종료된 미션이에요'}
                            </h2>
                            <p className="text-body text-fg-secondary">
                                {notYetOpen
                                    ? `${formatKst(mission.startsAt, PERIOD_FORMAT)}부터 참여할 수 있어요.`
                                    : '운영 기간이 지나 제출할 수 없어요.'}
                            </p>
                            <Button asChild variant="secondary">
                                <Link to="/missions">미션 목록으로</Link>
                            </Button>
                        </section>
                    ) : mission.missionType === 'QUIZ' ? (
                        <QuizForm key="quiz" mission={mission} onCompleted={handleCompleted} />
                    ) : (
                        <SurveyForm key="survey" mission={mission} onCompleted={handleCompleted} />
                    )}
                </AnimatePresence>
            </MotionConfig>

            <MissionRewardDialog
                open={rewardOpen}
                onOpenChange={setRewardOpen}
                tickets={rewardTickets}
            />
        </main>
    );
}
