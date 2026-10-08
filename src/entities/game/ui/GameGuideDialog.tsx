import { Button } from '@shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@shared/ui/dialog';

import type { GameContent } from '../model/gameContent';

/**
 * 게임 방법 모달 — 조작·점수·보상 3단계 안내와 이미지, 게임 시작 버튼.
 * 피그마(너비 392, 안내 12px)는 데스크톱에서 작아 보여 한 단계씩 키웠다:
 * 너비 480, 제목 Title 3, 부제 Body, 안내 Body SM, 아이콘 원 36, 이미지 비율 314:160, 버튼 Large(48)
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
                // 열릴 때 초점을 버튼이 아닌 모달 상자에 둬, 게임 시작 버튼에 초점 테두리가 먼저 생기지 않게 한다 (Tab을 누르면 버튼으로 간다)
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    (event.currentTarget as HTMLElement | null)?.focus();
                }}
                // 글자색을 fg/primary 토큰으로 고정 — 공용 Dialog의 테마 변수 색은 다크 모드에서 흰색으로 바뀐다
                className="bg-surface-page border-border-default text-fg-primary flex max-w-[calc(100%-2rem)] flex-col items-center gap-6 rounded-2xl border p-8 shadow-md ring-0 outline-none sm:max-w-120"
            >
                <div className="flex w-full flex-col items-center gap-4">
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
                                {/* 안내 문구의 줄바꿈(\n)을 그대로 살려 문장 단위로 끊어 보여준다. 조작 키는 키 모양으로 앞에 둔다 */}
                                <p className="text-body-sm text-fg-primary whitespace-pre-line">
                                    {step.keys && (
                                        <span className="mr-1.5 inline-flex gap-1 align-middle">
                                            {step.keys.map((key) => (
                                                <kbd
                                                    key={key}
                                                    className="border-border-strong bg-surface-elevated text-caption text-fg-primary inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-b-2 px-1.5 font-semibold"
                                                >
                                                    {key}
                                                </kbd>
                                            ))}
                                        </span>
                                    )}
                                    {step.text}
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>

                {/* 피그마 게임 방법 이미지 비율(314:160)을 지켜 장면이 잘리지 않게 한다 */}
                <img
                    src={guide.image}
                    alt=""
                    className="aspect-[314/160] w-full rounded-2xl object-cover"
                />

                {/* 공용 버튼 primary(검정, 모달의 주 행동) Large(48) */}
                <Button size="lg" className="w-full" onClick={onStart}>
                    게임 시작
                </Button>
            </DialogContent>
        </Dialog>
    );
}
