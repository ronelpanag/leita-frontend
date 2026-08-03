import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LegalPageShell } from './legal-page-shell';

@Component({
  selector: 'app-terms-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LegalPageShell, RouterLink],
  template: `
    <app-legal-page-shell heading="Terms and conditions" lastUpdated="3 August 2026">
      <section>
        <h2 class="text-heading-3">Who runs Leita</h2>
        <p class="mt-2">
          Leita is a job board and hiring platform operated by
          <strong>[Company legal name]</strong>, registered at
          <strong>[registered address]</strong> under company number
          <strong>[company number]</strong>. Reach us at <strong>[contact email]</strong>. In these
          terms “we” and “Leita” mean that company, and “you” means anyone using the service.
        </p>
      </section>

      <section>
        <h2 class="text-heading-3">Accounts</h2>
        <p class="mt-2">
          You need an account to apply to roles or to post them. Give accurate details, keep your
          password to yourself, and tell us if you think someone else has got into your account. You
          must be old enough to work in your jurisdiction to register as a candidate. One person,
          one account.
        </p>
        <p class="mt-2">
          Company accounts may only be created by someone authorised to act for that company.
        </p>
      </section>

      <section>
        <h2 class="text-heading-3">What you post</h2>
        <p class="mt-2">
          You keep ownership of what you write — job postings, cover letters, profile details. You
          give us permission to store and display it as needed to run the service: showing a posting
          on the public board, showing an application to the company you applied to.
        </p>
        <p class="mt-2">
          Post only what you have the right to post, and keep it lawful. Job postings must describe
          real roles and must not discriminate on protected characteristics. We may remove content
          or suspend accounts that break these rules.
        </p>
      </section>

      <section>
        <h2 class="text-heading-3">What Leita is not</h2>
        <p class="mt-2">
          We connect candidates and companies. We are not the employer, we are not a party to any
          hiring decision, and we do not guarantee that a posting is genuine, that an application
          will be read, or that any role will be filled. Hiring decisions and employment terms are
          entirely between the candidate and the company.
        </p>
      </section>

      <section>
        <h2 class="text-heading-3">Availability</h2>
        <p class="mt-2">
          We aim to keep Leita running but we do not promise uninterrupted service. We may change or
          withdraw features, and we may take the service down for maintenance.
        </p>
      </section>

      <section>
        <h2 class="text-heading-3">Liability</h2>
        <p class="mt-2">
          <strong>[Liability wording to be drafted by counsel for your jurisdiction.]</strong>
          Nothing in these terms limits liability that cannot be limited by law, such as for death
          or personal injury caused by negligence, or for fraud.
        </p>
      </section>

      <section>
        <h2 class="text-heading-3">Closing your account</h2>
        <p class="mt-2">
          You can stop using Leita at any time and ask us to delete your account — see
          <a routerLink="/privacy" class="font-medium text-spruce-700 hover:underline"
            >Privacy and cookies</a
          >
          for how that works and what we keep. We may suspend or close accounts that break these
          terms.
        </p>
      </section>

      <section>
        <h2 class="text-heading-3">Changes to these terms</h2>
        <p class="mt-2">
          If we change these terms we will update the date at the top of this page, and we will tell
          registered users about significant changes.
        </p>
      </section>

      <section>
        <h2 class="text-heading-3">Governing law</h2>
        <p class="mt-2">
          <strong>[Governing law and venue to be set by counsel.]</strong>
        </p>
      </section>
    </app-legal-page-shell>
  `,
})
export class TermsPage {}
