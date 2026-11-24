import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * Runs axe-core's WCAG 2.x A/AA rules on the page and fails with a readable
 * list of problems. Colour contrast is skipped because jsdom never paints;
 * themeContrast.test.ts checks the colour tokens instead.
 */
export async function expectNoAccessibilityViolations(root: Element = document.body) {
  const results = await axe.run(root, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    rules: { 'color-contrast': { enabled: false } },
  });
  const problems = results.violations.flatMap((violation) =>
    violation.nodes.map(
      (node) => `${violation.id}: ${violation.help} → ${node.html.slice(0, 120)}`,
    ),
  );
  expect(problems, `Accessibility problems:\n${problems.join('\n')}`).toEqual([]);
}
