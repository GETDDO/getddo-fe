import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { EntryConfirmDialog } from './EntryConfirmDialog';
import { InsufficientTicketsDialog } from './InsufficientTicketsDialog';

const NOOP = () => {};

// 부족 안내가 미션 링크를 포함해 라우터가 필요하다
const renderDialog = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('EntryConfirmDialog', () => {
    it('등급별 사용 장수와 합계를 함께 보여준다', () => {
        render(
            <EntryConfirmDialog
                open
                onOpenChange={NOOP}
                title="테스트 래플"
                tickets={{ GOLD: 2, SILVER: 1 }}
                balance={10}
                onConfirm={NOOP}
            />,
        );

        expect(
            screen.getByText('응모권 3장을 사용하여 테스트 래플에 참여합니다.'),
        ).toBeInTheDocument();
        expect(screen.getByText('실버 1장·골드 2장')).toBeInTheDocument();
        expect(screen.getByText('10장')).toBeInTheDocument();
    });

    it('빈 tickets 맵이면 0장으로 표시한다', () => {
        render(
            <EntryConfirmDialog
                open
                onOpenChange={NOOP}
                title="무료 이벤트"
                tickets={{}}
                balance={10}
                onConfirm={NOOP}
            />,
        );

        expect(screen.getByText('0장')).toBeInTheDocument();
    });
});

describe('InsufficientTicketsDialog', () => {
    it('브론즈 전용 이벤트면 브론즈 필요 안내를 보여준다', () => {
        renderDialog(<InsufficientTicketsDialog open onOpenChange={NOOP} bronzeRequired />);

        expect(screen.getByText('브론즈 응모권이 필요해요')).toBeInTheDocument();
        expect(screen.getByText(/브론즈 응모권으로만 응모할 수 있어요/)).toBeInTheDocument();
    });

    it('일반 부족 안내를 보여준다', () => {
        renderDialog(<InsufficientTicketsDialog open onOpenChange={NOOP} />);

        expect(screen.getByText('응모권이 부족해요')).toBeInTheDocument();
    });
});
