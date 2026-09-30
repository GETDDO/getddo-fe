import { X } from 'lucide-react';

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@shared/ui/dialog';

import type { GameContent } from './game-content';

/**
 * 게임 방법 모달 — 조작·점수·보상 3단계 안내와 이미지, 게임 시작 버튼.
 * 피그마(너비 392, 안내 12px)는 데스크톱에서 작아 보여 한 단계씩 키웠다:
 * 너비 480, 제목 Title 3, 부제 Body, 안내 Body SM, 아이콘 원 36, 이미지 높이 160, 버튼 Large(48)
 */
export function GameGuideDialog({
    open,
    onOpenChange,
    guide,
    onStart,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    guide: GameContent['guide'];
    onStart: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                // 글자색을 fg/primary 토큰으로 고정 — 공용 Dialog의 테마 변수 색은 다크 모드에서 흰색으로 바뀐다
                className="bg-surface-page border-border-default text-fg-primary flex max-w-[calc(100%-2rem)] flex-col items-center gap-6 rounded-2xl border p-8 shadow-md ring-0 sm:max-w-120"
            >
                <div className="flex w-full flex-col items-center gap-4">
                    <div className="flex h-6 w-full justify-end">
                        <DialogClose
                            aria-label="닫기"
                            className="text-fg-secondary hover:text-fg-primary cursor-pointer"
                        >
                            <X className="size-6" />
                        </DialogClose>
                    </div>
                    {/*
                      공용 DialogTitle·DialogDescription의 기본 글자 스타일 위에 덮어쓴다.
                      공용 cn이 글자 크기 토큰과 색 토큰을 같은 그룹으로 보고 하나를 지우므로, 색은 넘기지 않고
                      모달에 고정한 글자색(fg/primary)을 물려받게 한다 (피그마도 제목·부제 모두 fg/primary)
                    */}
                    <div className="flex flex-col items-center gap-1 text-center">
                        <DialogTitle className="text-title-3! leading-7 font-semibold">
                            {guide.title}
                        </DialogTitle>
                        <DialogDescription className="text-body!">
                            {/* 공용 DialogDescription의 흐린 기본 색을 안쪽 글자에서 덮는다 */}
                            <span className="text-fg-primary">{guide.subtitle}</span>
                        </DialogDescription>
                    </div>
                </div>

                {/* 단계 — 아이콘 원을 짧은 선으로 이어 순서를 보여준다 */}
                <ol className="flex w-full flex-col px-2 py-2">
                    {guide.steps.map((step, index) => (
                        <li key={step.text} className="flex flex-col">
                            {index > 0 && (
                                <span
                                    aria-hidden
                                    className="bg-border-default my-1.5 ml-[17px] h-5 w-0.5 rounded-full"
                                />
                            )}
                            <div className="flex items-center gap-4">
                                <span className="bg-border-default flex size-9 shrink-0 items-center justify-center rounded-full">
                                    <step.icon aria-hidden className="text-fg-primary size-5" />
                                </span>
                                <span className="text-body-sm text-fg-primary">{step.text}</span>
                            </div>
                        </li>
                    ))}
                </ol>

                <img src={guide.image} alt="" className="h-40 w-full rounded-2xl object-cover" />

                {/* 디자인 시스템 브랜드 버튼 Large(48): brand/primary 기본·호버·누름 */}
                <button
                    type="button"
                    onClick={onStart}
                    className="bg-brand-primary hover:bg-brand-primary-hover active:bg-brand-primary-pressed text-fg-on-brand text-body-bold focus-visible:ring-border-focus h-12 w-full cursor-pointer rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                    게임 시작
                </button>
            </DialogContent>
        </Dialog>
    );
}
