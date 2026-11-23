import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createEmptyAppData } from '../../models/appData';
import type { DataRepository, LoadResult } from '../../services/storage/DataRepository';
import { renderRoute } from '../../test/renderRoute';

function repositoryReturning(load: LoadResult): DataRepository {
  return { load: () => load, save: () => ({ ok: true }) };
}

describe('StorageNotice', () => {
  it('shows nothing when storage is healthy', () => {
    renderRoute('/', {
      repository: repositoryReturning({ status: 'empty', data: createEmptyAppData() }),
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
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

    const notice = screen.getByRole('status');
    expect(notice).toHaveTextContent('Some saved data couldn’t be loaded');
    expect(notice).toHaveTextContent('2 saved transactions were invalid and skipped.');
    expect(notice).toHaveTextContent('A copy of the original was kept');

    await user.click(screen.getByRole('button', { name: 'Dismiss message' }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('warns when storage is unavailable', () => {
    renderRoute('/', {
      repository: repositoryReturning({ status: 'unavailable', data: createEmptyAppData() }),
    });

    expect(screen.getByRole('status')).toHaveTextContent('Changes won’t be kept');
  });
});
