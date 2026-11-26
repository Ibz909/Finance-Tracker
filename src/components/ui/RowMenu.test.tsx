import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RowMenu } from './RowMenu';

function setup() {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  render(
    <>
      <RowMenu
        label="Actions for Rent"
        items={[
          { label: 'Edit', onSelect: onEdit },
          { label: 'Delete', onSelect: onDelete, destructive: true },
        ]}
      />
      <button type="button">Outside</button>
    </>,
  );
  return {
    user: userEvent.setup(),
    onEdit,
    onDelete,
    trigger: screen.getByRole('button', { name: 'Actions for Rent' }),
  };
}

describe('RowMenu', () => {
  it('is a closed menu button until opened', () => {
    const { trigger } = setup();

    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens on click with focus on the first item, and runs the chosen action', async () => {
    const { user, trigger, onDelete } = setup();

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();

    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('moves with the arrow keys, wraps, and jumps with Home and End', async () => {
    const { user, trigger } = setup();
    trigger.focus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
  });

  it('opens on the last item with ArrowUp and selects with Enter', async () => {
    const { user, trigger, onDelete } = setup();
    trigger.focus();

    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('closes with Escape and returns focus to the button', async () => {
    const { user, trigger, onEdit } = setup();

    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('closes when the pointer goes elsewhere', async () => {
    const { user, trigger } = setup();

    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Outside' }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
