import { CdkDrag, CdkDropList, type CdkDragDrop } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiClient, type Application, type PipelineStage } from '@core';
import { Button, EmptyState, Modal, Spinner, TextInput, ToastService } from '@shared';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { STAGE_ORDER, isLegalMove, legalTargets } from './pipeline-stages';

const interviewFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

/**
 * Kanban board for one posting's hiring pipeline. Cards move by drag-and-drop
 * (CDK) or by the per-card stage buttons — the keyboard-accessible path, since
 * drag-and-drop alone is not keyboard operable. Moves are optimistic and roll
 * back if MoveApplicationStageCommand rejects them. Legal targets mirror the
 * backend's stage state machine (pipeline-stages.ts).
 */
@Component({
  selector: 'app-pipeline-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Button,
    CdkDrag,
    CdkDropList,
    EmptyState,
    Modal,
    ReactiveFormsModule,
    RouterLink,
    Spinner,
    TextInput,
  ],
  template: `
    <div class="mx-auto w-full max-w-7xl px-gutter py-8">
      <a routerLink="/company" class="font-mono text-caption text-spruce-700 hover:underline">
        ← Hiring dashboard
      </a>
      <h1 class="mt-2 text-heading-1">Pipeline</h1>

      @if (loading()) {
        <div class="flex justify-center py-16">
          <app-spinner size="lg" label="Loading applications…" />
        </div>
      } @else if (error()) {
        <div class="mt-6">
          <app-empty-state
            title="Could not load the pipeline"
            description="Something went wrong. Try again in a moment."
          >
            <app-button variant="secondary" (click)="load()">Try again</app-button>
          </app-empty-state>
        </div>
      } @else if (applications().length === 0) {
        <div class="mt-6">
          <app-empty-state
            title="No applications yet"
            description="When candidates apply to this posting, their cards appear here and move along the trail."
          />
        </div>
      } @else {
        <div class="mt-6 overflow-x-auto pb-4">
          <div class="flex min-w-max gap-4" role="list" aria-label="Pipeline stages">
            @for (stage of stages; track stage) {
              <section
                role="listitem"
                class="w-64 shrink-0 rounded-card border border-line bg-birch/60"
                [attr.aria-label]="columnLabel(stage)"
              >
                <header class="flex items-center justify-between border-b border-line px-3 py-2">
                  <h2 class="font-mono text-caption font-medium text-ink">{{ stage }}</h2>
                  <span class="font-mono text-caption tabular-nums text-ink-muted">
                    {{ byStage()[stage].length }}
                  </span>
                </header>
                <div
                  cdkDropList
                  [id]="stage"
                  [cdkDropListData]="stage"
                  [cdkDropListConnectedTo]="stages"
                  (cdkDropListDropped)="onDrop($event)"
                  class="flex min-h-24 flex-col gap-2 p-2"
                >
                  @for (application of byStage()[stage]; track application.id) {
                    <article
                      cdkDrag
                      [cdkDragData]="application"
                      [cdkDragDisabled]="pending().has(application.id)"
                      class="cursor-grab select-none rounded-control border border-line bg-paper p-3
                             shadow-none transition-colors hover:border-line-strong
                             active:cursor-grabbing"
                    >
                      <p class="font-mono text-body-sm font-medium text-ink" translate="no">
                        Candidate {{ shortId(application.candidateId) }}
                      </p>
                      <p class="mt-1 font-mono text-caption text-ink-muted">
                        Applied {{ submittedLabel(application) }}
                      </p>
                      @if (nextInterviewLabel(application); as interview) {
                        <p class="mt-1 font-mono text-caption text-fjord-700">
                          Interview {{ interview }}
                        </p>
                      }
                      <div class="mt-2 flex flex-wrap gap-1.5">
                        @for (target of targetsFor(application); track target) {
                          <app-button
                            [variant]="target === 'Rejected' ? 'danger' : 'secondary'"
                            size="sm"
                            [loading]="pending().has(application.id)"
                            (click)="move(application, target)"
                          >
                            {{ target === 'Rejected' ? 'Reject' : '→ ' + target }}
                          </app-button>
                        }
                        <app-button variant="ghost" size="sm" (click)="openScheduling(application)">
                          Interview…
                        </app-button>
                      </div>
                    </article>
                  }
                </div>
              </section>
            }
          </div>
        </div>
      }

      <app-modal title="Schedule interview" [(open)]="schedulingOpen">
        <form class="flex flex-col gap-4" (submit)="scheduleInterview($event)">
          <app-text-input
            label="When"
            type="datetime-local"
            name="interview-at"
            [required]="true"
            [formControl]="interviewAt"
            [error]="interviewAtError()"
          />
          <app-text-input
            label="Location"
            name="interview-location"
            placeholder="Teams, office, phone…"
            hint="Leave empty if it's decided later."
            [formControl]="interviewLocation"
          />
          <div class="flex justify-end gap-3">
            <app-button variant="secondary" (click)="schedulingOpen.set(false)">Cancel</app-button>
            <app-button type="submit" [loading]="scheduling()">Schedule interview</app-button>
          </div>
        </form>
      </app-modal>
    </div>
  `,
})
export class PipelinePage {
  private readonly api = inject(ApiClient);
  private readonly toasts = inject(ToastService);

  /** Route param (jobs/:id/pipeline) via withComponentInputBinding. */
  readonly id = input.required<string>();

  // CDK's connectedTo input wants a mutable array type.
  protected readonly stages = [...STAGE_ORDER];
  protected readonly applications = signal<readonly Application[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly pending = signal<ReadonlySet<string>>(new Set());

  protected readonly schedulingOpen = signal(false);
  protected readonly scheduling = signal(false);
  protected readonly interviewAt = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  protected readonly interviewLocation = new FormControl('', { nonNullable: true });
  protected readonly interviewAtError = signal('');
  private schedulingTarget: Application | null = null;

  protected readonly byStage = computed(() => {
    const groups = Object.fromEntries(STAGE_ORDER.map((stage) => [stage, [] as Application[]]));
    for (const application of this.applications()) {
      groups[application.currentStage].push(application);
    }
    return groups as Record<PipelineStage, Application[]>;
  });

  constructor() {
    effect(() => {
      this.id();
      untracked(() => void this.load());
    });
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      this.applications.set(await firstValueFrom(this.api.getApplicationsForJob(this.id())));
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected targetsFor(application: Application): readonly PipelineStage[] {
    return legalTargets(application.currentStage);
  }

  protected columnLabel(stage: PipelineStage): string {
    const count = this.byStage()[stage].length;
    return `${stage} — ${count} ${count === 1 ? 'application' : 'applications'}`;
  }

  protected onDrop(event: CdkDragDrop<PipelineStage>): void {
    const application = event.item.data as Application;
    const target = event.container.data;
    if (target === application.currentStage) {
      return;
    }
    void this.move(application, target);
  }

  protected async move(application: Application, target: PipelineStage): Promise<void> {
    if (!isLegalMove(application.currentStage, target)) {
      this.toasts.show(
        `${application.currentStage} → ${target} is not a legal step. Applications advance one stage at a time.`,
        'error',
      );
      return;
    }
    const before = this.applications();
    this.setStageLocally(application.id, target);
    this.markPending(application.id, true);
    try {
      await firstValueFrom(this.api.moveApplicationStage(application.id, target));
      this.toasts.show(`Moved to ${target}`, 'success');
    } catch {
      this.applications.set(before);
      this.toasts.show('The move was rejected — the board has been restored.', 'error');
    } finally {
      this.markPending(application.id, false);
    }
  }

  protected openScheduling(application: Application): void {
    this.schedulingTarget = application;
    this.interviewAt.setValue('');
    this.interviewLocation.setValue('');
    this.interviewAtError.set('');
    this.schedulingOpen.set(true);
  }

  protected async scheduleInterview(event: Event): Promise<void> {
    event.preventDefault();
    const target = this.schedulingTarget;
    if (!target) {
      return;
    }
    this.interviewAtError.set(this.interviewAt.invalid ? 'Pick a date and time.' : '');
    if (this.interviewAt.invalid) {
      return;
    }
    this.scheduling.set(true);
    try {
      await firstValueFrom(
        this.api.scheduleInterview(target.id, {
          scheduledAtUtc: new Date(this.interviewAt.value).toISOString(),
          location: this.interviewLocation.value.trim() || null,
        }),
      );
      this.schedulingOpen.set(false);
      this.toasts.show('Interview scheduled', 'success');
      await this.load();
    } catch {
      this.toasts.show('Could not schedule the interview. Try again.', 'error');
    } finally {
      this.scheduling.set(false);
    }
  }

  protected shortId(candidateId: string): string {
    // The API sends no candidate name yet (docs/backend-follow-ups.md #6).
    return candidateId.slice(0, 8);
  }

  protected submittedLabel(application: Application): string {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
      new Date(application.submittedAtUtc),
    );
  }

  protected nextInterviewLabel(application: Application): string | null {
    const upcoming = application.interviews
      .map((interview) => new Date(interview.scheduledAtUtc))
      .sort((a, b) => a.getTime() - b.getTime())
      .at(-1);
    return upcoming ? interviewFormat.format(upcoming) : null;
  }

  private setStageLocally(applicationId: string, stage: PipelineStage): void {
    this.applications.update((applications) =>
      applications.map((application) =>
        application.id === applicationId ? { ...application, currentStage: stage } : application,
      ),
    );
  }

  private markPending(applicationId: string, pending: boolean): void {
    this.pending.update((current) => {
      const next = new Set(current);
      if (pending) {
        next.add(applicationId);
      } else {
        next.delete(applicationId);
      }
      return next;
    });
  }
}
