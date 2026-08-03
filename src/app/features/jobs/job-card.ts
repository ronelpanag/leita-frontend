import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { JobPostingSummary } from '@core';
import { Badge, Card } from '@shared';

const publishedFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

@Component({
  selector: 'app-job-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge, Card, RouterLink],
  template: `
    <app-card [featured]="job().promoted ?? false" [padded]="false">
      <a
        [routerLink]="['/jobs', job().id]"
        class="flex flex-col gap-2 rounded-card p-6 transition-colors hover:bg-birch/60"
      >
        <div class="flex items-start justify-between gap-3">
          <h3 class="min-w-0 break-words text-heading-3">{{ job().title }}</h3>
          @if (job().promoted) {
            <app-badge tone="warning">Featured</app-badge>
          }
        </div>
        <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-ink-muted">
          <span>{{ job().location || 'Location not specified' }}</span>
          @if (publishedLabel()) {
            <span aria-hidden="true" class="text-line-strong">·</span>
            <span class="font-mono text-caption">{{ publishedLabel() }}</span>
          }
        </p>
      </a>
    </app-card>
  `,
})
export class JobCard {
  readonly job = input.required<JobPostingSummary>();

  protected readonly publishedLabel = computed(() => {
    const publishedAt = this.job().publishedAtUtc;
    return publishedAt ? publishedFormat.format(new Date(publishedAt)) : '';
  });
}

// TEMPORARY: proves CI fails on a lint violation. Removed in the next commit.
const unusedOnPurpose: string = 'ci red check';
