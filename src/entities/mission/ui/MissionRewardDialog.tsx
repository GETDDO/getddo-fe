import type { ReactNode } from 'react';

import { motion } from 'framer-motion';

import rewardMascot from '@shared/assets/ui/reward-mascot.png';
import { Button } from '@shared/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@shared/ui/dialog';

/**
 * 미션 완료 보상 안내 — 게임 보상(RewardDialog)과 같은 연출로 받은 응모권 수를 알린다.
 * 등급 응모권 공개 카드는 응모권 쪽 부품이라 이 슬라이스에서 직접 쓰지 않고, 쓰는 쪽(페이지)이 reveal로 넣는다
 */
export function MissionRewardDialog({
    open,
    onOpenChange,
    tickets,
    gradeLabel,
    reveal,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tickets: number;
    /** 받은 등급 이름(예: 실버) — 있으면 제목에 붙인다 */
    gradeLabel?: string;
    /** 등급 응모권 공개 연출 — 있으면 타코야끼 그림 대신 보여 준다 */
    reveal?: ReactNode;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex flex-col items-center gap-4 text-center">
                {/* 응모권을 든 타코야끼가 톡 튀어나온다 — 게임 보상 모달과 같은 spring */}
                {reveal ?? (
                    <motion.img
                        src={rewardMascot}
                        alt=""
                        initial={{ opacity: 0, scale: 0.5, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 16, delay: 0.1 }}
                        className="mt-2 h-24 w-auto"
                    />
                )}
                <div className="flex flex-col items-center gap-1">
                    <DialogTitle>
                        {gradeLabel ? `${gradeLabel} ` : ''}응모권 {tickets}장을 받았어요
                    </DialogTitle>
                    <DialogDescription>미션 완료 보상이에요.</DialogDescription>
                </div>
                <DialogClose asChild>
                    <Button className="w-full">확인</Button>
                </DialogClose>
            </DialogContent>
        </Dialog>
    );
}
