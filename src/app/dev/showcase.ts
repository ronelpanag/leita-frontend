import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  Badge,
  Button,
  Card,
  CellDef,
  DataTable,
  EmptyState,
  Modal,
  SelectField,
  Spinner,
  TextInput,
  ToastOutlet,
  ToastService,
  type SelectOption,
  type TableColumn,
} from '@shared';

interface DemoRow extends Record<string, unknown> {
  readonly id: number;
  readonly candidate: string;
  readonly stage: string;
  readonly days: number;
}

/**
 * Internal design-system showcase. Dev-only: the route that loads this
 * component is compiled out of production builds.
 */
@Component({
  selector: 'app-showcase',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Badge,
    Button,
    Card,
    CellDef,
    DataTable,
    EmptyState,
    Modal,
    ReactiveFormsModule,
    SelectField,
    Spinner,
    TextInput,
    ToastOutlet,
  ],
  template: `
    <main class="mx-auto flex max-w-4xl flex-col gap-section px-gutter py-section">
      <header class="flex flex-col gap-2">
        <p class="font-mono text-caption text-spruce-500">Leita design system</p>
        <h1 class="text-display">Waymark</h1>
        <p class="max-w-xl text-body text-ink-muted">
          Nordic-functional components for the Leita hiring trail. Cool paper, spruce and
          cloudberry, honest edges.
        </p>
      </header>

      <section class="flex flex-col gap-4" aria-labelledby="sec-buttons">
        <h2 id="sec-buttons" class="text-heading-2">Button</h2>
        <div class="flex flex-wrap items-center gap-3">
          <app-button>Publish job</app-button>
          <app-button variant="secondary">Save draft</app-button>
          <app-button variant="ghost">View applicants</app-button>
          <app-button variant="danger">Close posting</app-button>
          <app-button [loading]="true">Saving…</app-button>
          <app-button [disabled]="true">Unavailable</app-button>
          <app-button size="sm" variant="secondary">Small</app-button>
        </div>
      </section>

      <section class="flex flex-col gap-4" aria-labelledby="sec-badges">
        <h2 id="sec-badges" class="text-heading-2">Badge — pipeline stages</h2>
        <div class="flex flex-wrap items-center gap-3">
          <app-badge [waymark]="true">Applied</app-badge>
          <app-badge tone="info" [waymark]="true">Screening</app-badge>
          <app-badge tone="warning" [waymark]="true">Interview</app-badge>
          <app-badge tone="success" [waymark]="true">Offer</app-badge>
          <app-badge tone="danger" [waymark]="true">Rejected</app-badge>
          <app-badge tone="neutral">42 applicants</app-badge>
        </div>
      </section>

      <section class="flex flex-col gap-4" aria-labelledby="sec-forms">
        <h2 id="sec-forms" class="text-heading-2">Input &amp; Select</h2>
        <div class="grid max-w-xl gap-5 sm:grid-cols-2">
          <app-text-input
            label="Email"
            type="email"
            name="email"
            autocomplete="email"
            placeholder="nora@example.no…"
            [spellcheckOff]="true"
            [formControl]="email"
          />
          <app-select-field
            label="Pipeline stage"
            placeholder="Choose a stage…"
            [options]="stageOptions"
            [formControl]="stage"
          />
          <app-text-input
            label="Company name"
            hint="Shown on all your public job postings."
            placeholder="Fjellheim AS…"
            [formControl]="company"
          />
          <app-text-input
            label="Job title"
            error="Enter a job title to continue."
            [formControl]="jobTitle"
          />
        </div>
      </section>

      <section class="flex flex-col gap-4" aria-labelledby="sec-cards">
        <h2 id="sec-cards" class="text-heading-2">Card</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <app-card>
            <h3 class="text-heading-3">Frontend Engineer</h3>
            <p class="mt-1 text-body-sm text-ink-muted">Fjellheim AS — Oslo, hybrid</p>
          </app-card>
          <app-card [featured]="true">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="text-heading-3">Staff Designer</h3>
                <p class="mt-1 text-body-sm text-ink-muted">Brevik Studio — Bergen</p>
              </div>
              <app-badge tone="warning">Featured</app-badge>
            </div>
          </app-card>
        </div>
      </section>

      <section class="flex flex-col gap-4" aria-labelledby="sec-table">
        <h2 id="sec-table" class="text-heading-2">Table</h2>
        <app-data-table
          caption="Applications in pipeline"
          [columns]="columns"
          [rows]="rows"
          rowKey="id"
        >
          <ng-template appCell="stage" let-row>
            <app-badge tone="info" [waymark]="true">{{ row.stage }}</app-badge>
          </ng-template>
        </app-data-table>
      </section>

      <section class="flex flex-col gap-4" aria-labelledby="sec-empty">
        <h2 id="sec-empty" class="text-heading-2">Empty state</h2>
        <app-empty-state
          title="No applications yet"
          description="When candidates apply to your postings, they appear here."
        >
          <app-button variant="secondary">Browse open roles</app-button>
        </app-empty-state>
      </section>

      <section class="flex flex-col gap-4" aria-labelledby="sec-overlay">
        <h2 id="sec-overlay" class="text-heading-2">Modal, Toast &amp; Spinner</h2>
        <div class="flex flex-wrap items-center gap-3">
          <app-button variant="secondary" (click)="modalOpen.set(true)">Open modal</app-button>
          <app-button variant="secondary" (click)="showToast()">Show toast</app-button>
          <app-spinner label="Loading applications…" />
        </div>
        <app-modal title="Schedule interview" [(open)]="modalOpen">
          <p class="text-body-sm text-ink-muted">
            Pick a time that works for the candidate. They receive an email invitation with the
            details.
          </p>
          <div class="mt-5 flex justify-end gap-3">
            <app-button variant="secondary" (click)="modalOpen.set(false)">Cancel</app-button>
            <app-button (click)="confirmSchedule()">Schedule interview</app-button>
          </div>
        </app-modal>
      </section>
    </main>
    <app-toast-outlet />
  `,
})
export class Showcase {
  private readonly toastService = inject(ToastService);

  protected readonly email = new FormControl('', { nonNullable: true });
  protected readonly company = new FormControl('', { nonNullable: true });
  protected readonly jobTitle = new FormControl('', { nonNullable: true });
  protected readonly stage = new FormControl('', { nonNullable: true });

  protected readonly modalOpen = signal(false);

  protected readonly stageOptions: readonly SelectOption[] = [
    { value: 'applied', label: 'Applied' },
    { value: 'screening', label: 'Screening' },
    { value: 'interview', label: 'Interview' },
    { value: 'offer', label: 'Offer' },
  ];

  protected readonly columns: readonly TableColumn[] = [
    { key: 'candidate', header: 'Candidate' },
    { key: 'stage', header: 'Stage' },
    { key: 'days', header: 'Days in stage', numeric: true },
  ];

  protected readonly rows: readonly DemoRow[] = [
    { id: 1, candidate: 'Nora Berg', stage: 'Interview', days: 3 },
    { id: 2, candidate: 'Bjørn Aas', stage: 'Screening', days: 8 },
    { id: 3, candidate: 'Ingrid Moe', stage: 'Applied', days: 1 },
  ];

  protected showToast(): void {
    this.toastService.show('Application submitted', 'success');
  }

  protected confirmSchedule(): void {
    this.modalOpen.set(false);
    this.toastService.show('Interview scheduled', 'success');
  }
}
