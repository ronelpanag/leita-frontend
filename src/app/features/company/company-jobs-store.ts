import { Injectable, inject, signal } from '@angular/core';
import { ApiClient, type CompanyJobPosting } from '@core';
import { firstValueFrom } from 'rxjs';

/** The caller company's postings — drafts and closed included, with counts. */
@Injectable({ providedIn: 'root' })
export class CompanyJobsStore {
  private readonly api = inject(ApiClient);

  private readonly rowsSignal = signal<readonly CompanyJobPosting[]>([]);
  readonly rows = this.rowsSignal.asReadonly();
  readonly loading = signal(false);

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.rowsSignal.set(await firstValueFrom(this.api.getCompanyJobs()));
    } finally {
      this.loading.set(false);
    }
  }

  async createDraft(title: string, description: string, location: string | null): Promise<string> {
    const created = await firstValueFrom(this.api.createJob({ title, description, location }));
    await this.load();
    return created.id;
  }

  async update(
    id: string,
    title: string,
    description: string,
    location: string | null,
  ): Promise<void> {
    await firstValueFrom(this.api.updateJob(id, { title, description, location }));
    await this.load();
  }

  async publish(id: string): Promise<void> {
    await firstValueFrom(this.api.publishJob(id));
    await this.load();
  }

  async close(id: string): Promise<void> {
    await firstValueFrom(this.api.closeJob(id));
    await this.load();
  }
}
