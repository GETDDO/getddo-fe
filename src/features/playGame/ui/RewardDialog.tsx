import { motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';

import rewardMascot from '@shared/assets/ui/reward-mascot.png';
import { Button } from '@shared/ui/button';
import {
    Dialog,
    DialogClose,
    DialogDescription,
    DialogOverlay,
    DialogTitle,
} from '@shared/ui/dialog';

/**
 * 게임 보상 적립 안내 — 오늘 첫 유효 플레이로 응모권을 받았을 때 결과 화면 위에 한 번 띄운다.
 * 공용 모달 부품(Dialog·DialogOverlay·DialogTitle·DialogDescription·DialogClose)을 그대로 쓰고,
 * 게임 화면 안에만 뜨도록 막을 fixed 대신 absolute로 바꾸고 포털 없이 그 자리에 그린다.
 * 공용 DialogContent는 포털·화면 전체 막이 묶여 있어 본문 상자만 같은 radix 부품으로 둔다.
 * 쓰는 쪽(게임 화면)이 position: relative여야 한다
 */
export function RewardDialog({
    open,
    onOpenChange,
    onClosed,
    tickets,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** 닫힌 뒤 초점을 둘 곳으로 옮긴다 (예: '다시 하기') */
    onClosed?: () => void;
    tickets: number;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* 공용 막의 화면 전체 고정·색만 게임 화면에 맞게 덮어쓴다 */}
            <DialogOverlay className="absolute z-10 bg-(--takko-ink)/30 supports-backdrop-filter:backdrop-blur-sm" />
            <DialogPrimitive.Content
                // 열릴 때 초점을 버튼이 아닌 모달 상자에 둬, 키보드로 플레이하던 중에도 버튼에 초점 테두리가 먼저 보이지 않게 한다
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    (event.currentTarget as HTMLElement | null)?.focus();
                }}
                onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    onClosed?.();
                }}
                className="bg-surface-page border-border-default text-fg-primary data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 absolute top-1/2 left-1/2 z-10 flex w-[min(17.5rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4 rounded-2xl border p-4 text-center shadow-md outline-none"
            >
                {/* 닫기 — 공용 DialogContent의 닫기 버튼과 같은 부품·모양을 그대로 쓴다 */}
                <DialogClose asChild>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-fg-secondary hover:text-fg-primary absolute top-2 right-2 cursor-pointer hover:bg-transparent dark:hover:bg-transparent"
                    >
                        <XIcon />
                        <span className="sr-only">Close</span>
                    </Button>
                </DialogClose>
                {/* 응모권을 든 타코야끼(피그마 image 114)가 톡 튀어나온다 */}
                <motion.img
                    src={rewardMascot}
                    alt=""
                    initial={{ opacity: 0, scale: 0.5, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 16, delay: 0.1 }}
                    className="mt-2 h-24 w-auto"
                />
                {/*
                  공용 DialogTitle·Description의 기본 글자 스타일 위에 덮어쓴다 (GameGuideDialog와 같은 방식).
                  공용 cn이 글자 크기와 색 토큰을 한 그룹으로 보고 하나를 지우므로 색은 안쪽 글자에 준다
                */}
                <div className="flex flex-col items-center gap-1">
                    <DialogTitle className="text-body-bold! leading-6">
                        응모권 {tickets}장을 적립했어요
                    </DialogTitle>
                    <DialogDescription className="text-body-sm!">
                        <span className="text-fg-secondary">오늘의 게임 보상이에요.</span>
                    </DialogDescription>
                </div>
                {/* 공용 버튼 primary Medium(40) */}
                <DialogClose asChild>
                    <Button className="w-full">확인</Button>
                </DialogClose>
            </DialogPrimitive.Content>
        </Dialog>
    );
}
