import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Shared chrome for the legal pages: title, last-updated line and the
 * unmistakable notice that the wording is a template, not vetted copy.
 */
@Component({
  selector: 'app-legal-page-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto w-full max-w-2xl px-gutter py-section">
      <h1 class="text-heading-1">{{ heading() }}</h1>
      <p class="mt-1 font-mono text-caption text-ink-muted">Last updated {{ lastUpdated() }}</p>

      <div
        role="note"
        class="mt-6 rounded-card border border-cloudberry-500 bg-cloudberry-100 px-4 py-3
               text-body-sm text-cloudberry-700"
      >
        <strong class="font-semibold">Template — not legal advice.</strong>
        This page describes what the product actually does technically, but the wording has not been
        reviewed by a lawyer and the company details are placeholders. Have counsel review it and
        fill in the blanks before Leita serves real users.
      </div>

      <div class="mt-8 flex flex-col gap-6 text-body text-ink">
        <ng-content />
      </div>
    </div>
  `,
})
export class LegalPageShell {
  readonly heading = input.required<string>();
  readonly lastUpdated = input.required<string>();
}
