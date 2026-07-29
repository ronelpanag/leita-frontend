import { provideRouter } from '@angular/router';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { FollowsStore } from '@core';
import type { Company } from '@core';
import { FollowingPage } from './following-page';

const COMPANIES: readonly Company[] = [
  { id: 'co-1', name: 'Fjellheim AS', description: 'Nordic outdoor software.', website: null },
];

function stubStore(overrides: Partial<Record<keyof FollowsStore, unknown>> = {}) {
  return {
    companies: () => COMPANIES,
    isPending: () => false,
    load: vi.fn().mockResolvedValue(undefined),
    unfollow: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as FollowsStore;
}

async function renderPage(store: FollowsStore) {
  return render(FollowingPage, {
    providers: [provideRouter([]), { provide: FollowsStore, useValue: store }],
  });
}

describe('FollowingPage', () => {
  it('lists followed companies with an unfollow control', async () => {
    const store = stubStore();
    await renderPage(store);
    await waitFor(() => expect(store.load).toHaveBeenCalled());
    expect(screen.getByText('Fjellheim AS')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Unfollow' })).toBeTruthy();
  });

  it('unfollows a company on click', async () => {
    const store = stubStore();
    const user = userEvent.setup();
    await renderPage(store);
    await user.click(screen.getByRole('button', { name: 'Unfollow' }));
    expect(store.unfollow).toHaveBeenCalledWith('co-1');
  });

  it('shows the empty state when nobody is followed', async () => {
    const store = stubStore({ companies: () => [] });
    await renderPage(store);
    expect(await screen.findByText("You're not following anyone yet")).toBeTruthy();
  });

  it('shows an error state when loading fails', async () => {
    const store = stubStore({
      companies: () => null,
      load: vi.fn().mockRejectedValue(new Error('boom')),
    });
    await renderPage(store);
    expect(await screen.findByText('Could not load followed companies')).toBeTruthy();
  });
});
