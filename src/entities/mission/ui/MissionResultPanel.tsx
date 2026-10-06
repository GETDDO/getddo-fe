import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import { Button } from '@shared/ui/button';

/** 미션 완료 결과 패널 — 제출 폼이 빠져나간 자리에 spring으로 나타난다 */
export function MissionResultPanel({ title, tickets }: { title: string; tickets: number }) {
    return (
        <motion.section
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="bg-surface-page border-border-default flex flex-col items-center gap-4 rounded-2xl border p-8 text-center"
        >
            <h2 className="text-title-2 text-fg-primary">{title}</h2>
            <p className="text-body text-fg-secondary">응모권 {tickets}장을 받았어요.</p>
            <Button asChild variant="primary">
                <Link to="/missions">미션 목록으로</Link>
            </Button>
        </motion.section>
    );
}
