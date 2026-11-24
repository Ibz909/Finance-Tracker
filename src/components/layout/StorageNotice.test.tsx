import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createEmptyAppData } from '../../models/appData';
import type { DataRepository, LoadResult } from '../../services/storage/DataRepository';
import { renderRoute } from '../../test/renderRoute';

function repositoryReturning(load: LoadResult): DataRepository {
  return { load: () => load, save: () => ({ ok: true }), clearBackups: () => ({ ok: true }) };
}

describe('StorageNotice', () => {
  it('shows nothing when storage is healthy', () => {
    renderRoute('/', {
      repository: repositoryReturning({ status: 'empty', data: createEmptyAppData() }),
    });

    // Only the (empty) notifications live region should be present.
    expect(screen.getAllByRole('status')).toEqual([
      screen.getByRole('status', { name: 'Notifications' }),
    ]);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('explains recovered data and can be dismissed', async () => {
    const { user } = renderRoute('/', {
      repository: repositoryReturning({
        status: 'recovered',
        data: createEmptyAppData(),
        problem: '2 saved transactions were invalid and skipped.',
        skippedRecords: 2,
        backupKey: 'finance-tracker:data-backup:x',
      }),
    });

    const notice = screen.getByRole('status', { name: 'Some saved data couldn’t be loaded' });
    expect(notice).toHaveTextContent('2 saved transactions were invalid and skipped.');
    expect(notice).toHaveTextContent('A copy of the original was kept');

    await user.click(screen.getByRole('button', { name: 'Dismiss message' }));

    expect(notice).not.toBeInTheDocument();
  });

  it('warns when storage is unavailable', () => {
    renderRoute('/', {
      repository: repositoryReturning({ status: 'unavailable', data: createEmptyAppData() }),
    });

    expect(screen.getByRole('status', { name: 'Changes won’t be kept' })).toHaveTextContent(
      'blocking local storage',
    );
  });
});
