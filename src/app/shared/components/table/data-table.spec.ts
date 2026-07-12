import { Component } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { CellDef, DataTable, type TableColumn } from './data-table';

interface ApplicationRow extends Record<string, unknown> {
  readonly id: number;
  readonly candidate: string;
  readonly stage: string;
  readonly days: number;
}

@Component({
  imports: [DataTable, CellDef],
  template: `
    <app-data-table
      caption="Applications in pipeline"
      [columns]="columns"
      [rows]="rows"
      rowKey="id"
    >
      <ng-template appCell="stage" let-row>
        <strong>{{ row.stage }}</strong>
      </ng-template>
    </app-data-table>
  `,
})
class Host {
  readonly columns: readonly TableColumn[] = [
    { key: 'candidate', header: 'Candidate' },
    { key: 'stage', header: 'Stage' },
    { key: 'days', header: 'Days in stage', numeric: true },
  ];
  readonly rows: readonly ApplicationRow[] = [
    { id: 1, candidate: 'Nora Berg', stage: 'Interview', days: 3 },
    { id: 2, candidate: 'Bjørn Aas', stage: 'Screening', days: 8 },
  ];
}

describe('DataTable', () => {
  it('renders real table semantics with headers and rows', async () => {
    await render(Host);
    expect(screen.getByRole('table', { name: 'Applications in pipeline' })).toBeTruthy();
    expect(screen.getAllByRole('columnheader').length).toBe(3);
    expect(screen.getByRole('cell', { name: 'Nora Berg' })).toBeTruthy();
  });

  it('renders custom cell templates for mapped columns', async () => {
    await render(Host);
    const strong = screen.getByText('Interview');
    expect(strong.tagName).toBe('STRONG');
  });

  it('right-aligns numeric columns with tabular figures', async () => {
    await render(Host);
    const cell = screen.getByRole('cell', { name: '3' });
    expect(cell.className).toContain('text-right');
    expect(cell.className).toContain('tabular-nums');
  });
});
