import { useId, useState } from 'react';

import type { PublishedPrize } from '@entities/drawResult';

import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';

const SUFFIX_LENGTH = 4;

interface WinnerLookupCardProps {
    prizes: PublishedPrize[];
    /** 조회한 뒷자리와 명단에 있었는지를 올려 보낸다 — 상위가 당첨·낙첨 배너를 맡는다 */
    onLookup: (suffix: string, found: boolean) => void;
}

/**
 * 휴대폰 뒷자리로 내 당첨 여부를 찾아보는 카드.
 *
 * 이미 공개된 명단 안에서 찾는 것이라 서버에 따로 묻지 않는다 — 명단에 없는 정보를
 * 꺼내 오는 조회가 아니므로 공개 범위가 넓어지지 않는다.
 */
export function WinnerLookupCard({ prizes, onLookup }: WinnerLookupCardProps) {
    const inputId = useId();
    const [suffix, setSuffix] = useState('');

    const isComplete = suffix.length === SUFFIX_LENGTH;

    const lookup = () => {
        if (!isComplete) return;
        const found = prizes.some((prize) =>
            prize.winners.some((winner) => winner.maskedPhoneNum === suffix),
        );
        onLookup(suffix, found);
    };

    return (
        <section className="bg-surface-page border-border-default flex flex-col items-center gap-6 rounded-2xl border p-8 shadow-md">
            <h3 className="text-title-3 text-fg-primary">당첨자 조회</h3>

            <div className="flex w-full max-w-80 flex-col items-center gap-2">
                <label htmlFor={inputId} className="sr-only">
                    휴대폰 뒷자리 4자리
                </label>
                <Input
                    id={inputId}
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={SUFFIX_LENGTH}
                    placeholder="0000"
                    value={suffix}
                    onChange={(e) => {
                        // 숫자만 받는다 — 서버가 내려준 뒷자리와 그대로 맞춰 보는 값이다
                        setSuffix(e.target.value.replace(/\D/g, '').slice(0, SUFFIX_LENGTH));
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && lookup()}
                    className="text-center tabular-nums"
                />
                <Button onClick={lookup} disabled={!isComplete} className="w-full">
                    조회하기
                </Button>
                <p className="text-body-sm text-fg-tertiary text-center">
                    당첨자 조회는 휴대폰 뒷자리 번호(4자리)를 입력하여 확인 가능합니다.
                </p>
            </div>
        </section>
    );
}
