import { render, screen } from '@testing-library/angular';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('renders title and description', async () => {
    await render(
      `<app-empty-state
        title="No applications yet"
        description="When candidates apply to your postings, they appear here."
      />`,
      { imports: [EmptyState] },
    );
    expect(screen.getByText('No applications yet')).toBeTruthy();
    expect(
      screen.getByText('When candidates apply to your postings, they appear here.'),
    ).toBeTruthy();
  });

  it('projects an action and hides the trail illustration from screen readers', async () => {
    const { container } = await render(
      `<app-empty-state title="No postings yet">
        <button type="button">Create your first job</button>
      </app-empty-state>`,
      { imports: [EmptyState] },
    );
    expect(screen.getByRole('button', { name: 'Create your first job' })).toBeTruthy();
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});
