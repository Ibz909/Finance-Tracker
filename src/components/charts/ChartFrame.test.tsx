import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChartFrame } from './ChartFrame';

describe('ChartFrame', () => {
  it('hides the chart from assistive technology', () => {
    render(
      <ChartFrame>
        <svg data-testid="chart" />
      </ChartFrame>,
    );
    expect(screen.getByTestId('chart').closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('takes every SVG group out of the Tab order, including ones drawn later', async () => {
    const { container } = render(
      <ChartFrame>
        <svg>
          <g className="first" />
        </svg>
      </ChartFrame>,
    );
    const svg = container.querySelector('svg');
    if (!svg) throw new Error('No svg');
    expect(svg.querySelector('g.first')).toHaveAttribute('tabindex', '-1');

    // Recharts adds layers after the first render.
    const later = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.append(later);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(later).toHaveAttribute('tabindex', '-1');
  });
});
