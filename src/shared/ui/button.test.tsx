import { render, screen } from '@testing-library/react';

import { Button } from './button';

describe('Button', () => {
    it('renders children and is clickable', () => {
        render(<Button>응모하기</Button>);
        expect(screen.getByRole('button', { name: '응모하기' })).toBeInTheDocument();
    });
});
