import { useId, useState } from 'react';

import type { PublishedPrize } from '@entities/drawResult';

import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';

const SUFFIX_LENGTH = 4;

interface Match {
    maskedName: string;
    maskedPhoneNum: string;
    prizeName: string;
}

/**
 * 휴대폰 뒷자리로 내 당첨 여부를 찾아보는 카드.
 *
 * 이미 공개된 명단 안에서 찾는 것이라 서버에 따로 묻지 않는다 — 명단에 없는 정보를
 * 꺼내 오는 조회가 아니므로 공개 범위가 넓어지지 않는다.
 * 뒷자리가 같은 사람이 여럿일 수 있어 찾은 결과를 모두 보여 주고, 이름으로 가려 보게 한다.
 */
export function WinnerLookupCard({ prizes }: { prizes: PublishedPrize[] }) {
    const inputId = useId();
    const [suffix, setSuffix] = useState('');
    const [matches, setMatches] = useState<Match[] | null>(null);

    const isComplete = suffix.length === SUFFIX_LENGTH;

    const lookup = () => {
        if (!isComplete) return;
        setMatches(
            prizes.flatMap((prize) =>
                prize.winners
                    .filter((winner) => winner.maskedPhoneNum === suffix)
                    .map((winner) => ({
                        maskedName: winner.maskedName,
                        maskedPhoneNum: winner.maskedPhoneNum ?? suffix,
                        prizeName: prize.name,
                    })),
            ),
        );
    };

    return (
        <section className="bg-surface-page border-border-default flex flex-col items-center gap-6 rounded-2xl border p-8 shadow-md">
            {matches == null ? (
                <h3 className="text-title-3 text-fg-primary">당첨자 조회</h3>
            ) : matches.length > 0 ? (
                <>
                    <h3 className="text-title-3 text-fg-primary">당첨을 축하드립니다!</h3>
                    <ul className="flex flex-col items-center gap-2">
                        {matches.map((match) => (
                            <li
                                key={`${match.prizeName}-${match.maskedName}`}
                                className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1"
                            >
                                <span className="text-body-bold text-fg-primary">
                                    {match.maskedName} [{match.maskedPhoneNum}]
                                </span>
                                <span className="text-body text-fg-tertiary">
                                    {match.prizeName}
                                </span>
                            </li>
                        ))}
                    </ul>
                </>
            ) : (
                <>
                    <h3 className="text-title-3 text-fg-primary">당첨자 명단에 없어요</h3>
                    {/* 조회 결과가 없다고 '낙첨'으로 단정하지 않는다 — 입력을 잘못했을 수도 있다 */}
                    <p className="text-body text-fg-secondary text-center">
                        입력한 뒷자리와 일치하는 당첨자가 없어요. 번호를 다시 확인해 주세요.
                    </p>
                </>
            )}

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
                        setMatches(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && lookup()}
                    className="text-center tabular-nums"
                />
                <Button onClick={lookup} disabled={!isComplete} className="w-full">
                    {matches == null ? '조회하기' : '다시 조회하기'}
                </Button>
                <p className="text-body-sm text-fg-tertiary text-center">
                    당첨자 조회는 휴대폰 뒷자리 번호(4자리)를 입력하여 확인 가능합니다.
                </p>
            </div>
        </section>
    );
}
