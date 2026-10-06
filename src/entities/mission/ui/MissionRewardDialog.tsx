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

/** 미션 완료 보상 안내 — 게임 보상(RewardDialog)과 같은 연출로 받은 응모권 수를 알린다 */
export function MissionRewardDialog({
    open,
    onOpenChange,
    tickets,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tickets: number;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex flex-col items-center gap-4 text-center">
                {/* 응모권을 든 타코야끼가 톡 튀어나온다 — 게임 보상 모달과 같은 spring */}
                <motion.img
                    src={rewardMascot}
                    alt=""
                    initial={{ opacity: 0, scale: 0.5, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 16, delay: 0.1 }}
                    className="mt-2 h-24 w-auto"
                />
                <div className="flex flex-col items-center gap-1">
                    <DialogTitle>응모권 {tickets}장을 받았어요</DialogTitle>
                    <DialogDescription>미션 완료 보상이에요.</DialogDescription>
                </div>
                <DialogClose asChild>
                    <Button className="w-full">확인</Button>
                </DialogClose>
            </DialogContent>
        </Dialog>
    );
}
