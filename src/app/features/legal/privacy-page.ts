import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LegalPageShell } from './legal-page-shell';

@Component({
  selector: 'app-privacy-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LegalPageShell],
  template: `
    <app-legal-page-shell heading="Privacy and cookies" lastUpdated="3 August 2026">
      <section>
        <h2 class="text-heading-3">The short version</h2>
        <p class="mt-2">
          Leita stores what it needs to run a hiring platform and nothing else. There is no
          advertising, no analytics, no tracking pixels, and no third-party scripts — the fonts are
          served from our own domain, so loading a page contacts nobody but us. That is also why you
          are not seeing a cookie consent banner: we explain why below.
        </p>
      </section>

      <section>
        <h2 class="text-heading-3">What we store about you</h2>
        <ul class="mt-2 flex list-disc flex-col gap-2 pl-5">
          <li>
            <strong>Account:</strong> your name and email address, and a hash of your password.
          </li>
          <li>
            <strong>As a candidate:</strong> the roles you apply to, any cover letter you write, the
            stage each application has reached, scheduled interviews, and the companies you follow.
          </li>
          <li>
            <strong>As a company:</strong> your company profile and your job postings, plus the
            applications candidates send you.
          </li>
        </ul>
        <p class="mt-2">
          When you apply to a role, the company that posted it sees your name, your application and
          your cover letter. That is the point of applying, and it is the only place your
          application is shared.
        </p>
      </section>

      <section>
        <h2 class="text-heading-3">Cookies and browser storage</h2>
        <p class="mt-2">
          Leita uses exactly two pieces of browser storage, both strictly necessary to keep you
          signed in:
        </p>

        <div class="mt-4 overflow-x-auto rounded-card border border-line bg-paper">
          <table class="w-full border-collapse text-body-sm">
            <caption class="sr-only">
              Cookies and browser storage used by Leita
            </caption>
            <thead>
              <tr class="border-b border-line">
                <th scope="col" class="px-4 py-3 text-left font-mono text-caption text-ink-muted">
                  Name
                </th>
                <th scope="col" class="px-4 py-3 text-left font-mono text-caption text-ink-muted">
                  Type
                </th>
                <th scope="col" class="px-4 py-3 text-left font-mono text-caption text-ink-muted">
                  Purpose
                </th>
                <th scope="col" class="px-4 py-3 text-left font-mono text-caption text-ink-muted">
                  Expires
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-line/60">
                <td class="px-4 py-3 font-mono text-caption" translate="no">leita_refresh</td>
                <td class="px-4 py-3">Cookie (httpOnly)</td>
                <td class="px-4 py-3">
                  Keeps you signed in between visits. Set by our server and unreadable to
                  JavaScript, so it cannot be stolen by a script.
                </td>
                <td class="px-4 py-3">7 days</td>
              </tr>
              <tr>
                <td class="px-4 py-3 font-mono text-caption" translate="no">leita.hasSession</td>
                <td class="px-4 py-3">Local storage</td>
                <td class="px-4 py-3">
                  A yes/no flag so the app knows whether to try restoring your session on load. It
                  holds no identifier and no personal data.
                </td>
                <td class="px-4 py-3">Until you sign out</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="mt-4">
          Both exist only to deliver a service you asked for — being signed in. Under the ePrivacy
          rules that makes them <em>strictly necessary</em>, which is the category that does not
          require prior consent, so Leita does not interrupt you with a consent banner. We still
          have to tell you they exist, which is what this page does. If Leita ever adds analytics or
          any third-party service, that changes: we would need your consent first, and you would get
          a real choice before anything non-essential is stored.
        </p>
        <p class="mt-2">
          Blocking these two in your browser will not break browsing the public job board, but you
          will not be able to stay signed in.
        </p>
      </section>

      <section>
        <h2 class="text-heading-3">Your rights</h2>
        <p class="mt-2">
          You can ask us for a copy of your data, ask us to correct it, or ask us to delete your
          account and the data attached to it. Write to <strong>[contact email]</strong> and we will
          respond within the period the law allows. You can also complain to your national data
          protection authority.
        </p>
        <p class="mt-2">
          <strong
            >[Legal basis, retention periods, processors and international transfers to be completed
            with counsel — these depend on your hosting setup and jurisdiction.]</strong
          >
        </p>
      </section>

      <section>
        <h2 class="text-heading-3">Who to contact</h2>
        <p class="mt-2">
          <strong>[Company legal name]</strong>, <strong>[registered address]</strong>. Data
          protection enquiries: <strong>[contact email]</strong>.
        </p>
      </section>
    </app-legal-page-shell>
  `,
})
export class PrivacyPage {}
