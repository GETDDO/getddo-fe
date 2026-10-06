import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { formatKst } from '@shared/lib/date';
import { Button } from '@shared/ui/button';

const TIME_ONLY: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
};

/**
 * 미션 완료 결과 패널 — 제출 폼이 빠져나간 자리에 spring으로 나타난다.
 * receivedAt은 서버가 기록한 접수 시각 — 화면 시계가 아니라 서버 응답을 보여준다 (시간 규칙).
 */
export function MissionResultPanel({
    title,
    tickets,
    receivedAt,
}: {
    title: string;
    tickets: number;
    /** 서버 접수 시각(ISO) — 공정성 근거로 함께 보여준다 */
    receivedAt?: string;
}) {
    // 폼에서 결과로 바뀔 때 스크린리더·키보드 사용자가 새 화면을 놓치지 않게 제목으로 초점을 옮긴다
    const headingRef = useRef<HTMLHeadingElement>(null);
    useEffect(() => {
        headingRef.current?.focus();
    }, []);

    return (
        <motion.section
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="bg-surface-page border-border-default flex flex-col items-center gap-4 rounded-2xl border p-8 text-center"
        >
            <h2
                ref={headingRef}
                tabIndex={-1}
                className="text-title-2 text-fg-primary focus:outline-none"
            >
                {title}
            </h2>
            <div className="flex flex-col gap-1">
                <p className="text-body text-fg-secondary">응모권 {tickets}장을 받았어요.</p>
                {receivedAt && (
                    <p className="text-body-sm text-fg-tertiary">
                        서버에 {formatKst(receivedAt, TIME_ONLY)}에 접수됐어요
                    </p>
                )}
            </div>
            <Button asChild variant="primary">
                <Link to="/missions">미션 목록으로</Link>
            </Button>
        </motion.section>
    );
}
