import type { ReactNode } from 'react';

import { ArrowDown, Check } from 'lucide-react';

interface StepTileProps {
    /** 픽셀 아이콘 그림 — 없으면 이름부터 시작한다 */
    icon?: string;
    /** 그림마다 여백이 달라 크기가 달라 보일 때 맞추는 배율 클래스 */
    iconScale?: string;
    label: string;
    /** 이름 앞에 붙이는 표시 (예: 진행 중을 알리는 점) */
    labelPrefix?: ReactNode;
    value: ReactNode;
    /** 값 옆에 붙이는 표시 (예: 진행 점 ●●○) */
    valueSuffix?: ReactNode;
    /** 값 아래 한 줄 보조 설명 */
    hint?: ReactNode;
    /** 다 끝났으면 노란 테두리와 아이콘 귀퉁이에 노란 체크 */
    done?: boolean;
    /** 누르면 내려갈 섹션의 id */
    targetId: string;
}

const scrollToSection = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/**
 * 페이지 머리의 진행 칸 한 칸 — 미션 "오늘의 적립"(출석·게임·설문퀴즈)과 겟또타임(진행 중·오픈 예정·오늘 발표).
 * 픽셀 아이콘(있으면)을 바탕 없이 두고, 누르면 아래 해당 섹션으로 내려간다. 누를 수 있다는 걸 알리도록
 * 오른쪽 위에 아래 화살표를 늘 두고(터치에서도 보이게), 마우스를 올리면 화살표가 진해지고 그림자가 깊어진다. 칸은 움직이지 않는다
 * 아이콘이 없어도 칸 높이는 아이콘 있는 칸과 같다 — 미션·겟또타임 머리의 높이와 내용 시작 위치가 같아진다
 */
function StepTile({
    icon,
    iconScale,
    label,
    labelPrefix,
    value,
    valueSuffix,
    hint,
    done = false,
    targetId,
}: StepTileProps) {
    const labelNode = (
        <span className="text-caption sm:text-body-sm text-fg-secondary flex items-center gap-1.5 pr-5">
            {labelPrefix}
            {label}
        </span>
    );
    const hintNode = hint && <span className="text-caption text-fg-tertiary">{hint}</span>;

    return (
        <button
            type="button"
            onClick={() => scrollToSection(targetId)}
            className={`group/step bg-surface-page focus-visible:ring-border-focus relative flex min-h-26.5 min-w-0 cursor-pointer flex-col justify-between gap-2 rounded-2xl p-3 text-left shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:outline-none sm:min-h-32.5 sm:gap-3 sm:p-4 ${done ? 'ring-ticket-primary ring-2' : ''}`}
        >
            <ArrowDown
                aria-hidden
                className="text-fg-disabled group-hover/step:text-fg-primary absolute top-3 right-3 size-4 transition-colors sm:top-4 sm:right-4"
            />
            {icon && (
                <span className="relative size-8 sm:size-9">
                    <img
                        src={icon}
                        alt=""
                        className={`size-full object-contain ${iconScale ?? ''}`}
                    />
                    {done && (
                        <span className="bg-ticket-primary text-ticket-on ring-surface-page absolute -right-1 -bottom-1 flex size-4.5 items-center justify-center rounded-full ring-2">
                            <Check className="size-3" strokeWidth={3} />
                        </span>
                    )}
                </span>
            )}
            {icon ? (
                <span className="flex flex-col gap-0.5">
                    {labelNode}
                    <span className="flex min-w-0 items-center gap-2">
                        <span className="text-body-sm-bold sm:text-body-bold text-fg-primary truncate tabular-nums">
                            {value}
                        </span>
                        {valueSuffix}
                    </span>
                    {hintNode}
                </span>
            ) : (
                // 아이콘이 없으면 이름은 위(화살표와 같은 줄), 값·보조 설명은 아래로 붙여 칸 아래가 비지 않게 한다
                <>
                    {labelNode}
                    <span className="flex flex-col gap-0.5">
                        <span className="flex min-w-0 items-center gap-2">
                            <span className="text-body-bold sm:text-title-3 text-fg-primary truncate tabular-nums">
                                {value}
                            </span>
                            {valueSuffix}
                        </span>
                        {hintNode}
                    </span>
                </>
            )}
        </button>
    );
}

export { StepTile };
