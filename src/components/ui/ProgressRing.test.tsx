import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressRing } from './ProgressRing';

describe('ProgressRing', () => {
  it('is one image whose name says everything the ring shows', () => {
    render(
      <ProgressRing
        percent={97}
        tone="warning"
        label="97% of your monthly budget used, nearing limit"
      />,
    );

    expect(
      screen.getByRole('img', { name: '97% of your monthly budget used, nearing limit' }),
    ).toBeInTheDocument();
  });

  it('shows the real percentage past 100, with the ring capped at full', () => {
    const { container } = render(<ProgressRing percent={130} tone="negative" label="130% used" />);

    expect(screen.getByRole('img')).toHaveTextContent('130%');
    const [, fill] = container.querySelectorAll('circle');
    expect(fill).toHaveAttribute('stroke-dashoffset', '0');
  });

  it('draws no fill at 0%, so no stray dot appears', () => {
    const { container } = render(<ProgressRing percent={0} tone="accent" label="0% used" />);

    expect(container.querySelectorAll('circle')).toHaveLength(1);
  });
});
