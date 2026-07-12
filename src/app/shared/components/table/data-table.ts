import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChildren,
  Directive,
  inject,
  input,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export interface TableColumn {
  readonly key: string;
  readonly header: string;
  /** Right-aligns and sets tabular mono figures — for counts, dates, amounts. */
  readonly numeric?: boolean;
}

/** Custom cell template for a column: <ng-template appCell="status" let-row>…</ng-template> */
@Directive({ selector: 'ng-template[appCell]' })
export class CellDef {
  readonly appCell = input.required<string>();
  readonly template = inject(TemplateRef);
}

/**
 * Accessible data table: real <table> semantics, a caption for screen
 * readers, and horizontal scrolling contained in its own wrapper so the
 * page never scrolls sideways.
 */
@Component({
  selector: 'app-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  template: `
    <div class="overflow-x-auto rounded-card border border-line bg-paper">
      <table class="w-full border-collapse text-body-sm">
        <caption class="sr-only">
          {{
            caption()
          }}
        </caption>
        <thead>
          <tr class="border-b border-line">
            @for (column of columns(); track column.key) {
              <th
                scope="col"
                class="px-4 py-3 text-left font-mono text-caption font-medium text-ink-muted"
                [class.text-right]="column.numeric"
              >
                {{ column.header }}
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track trackRow($index, row)) {
            <tr class="border-b border-line/60 transition-colors last:border-b-0 hover:bg-birch">
              @for (column of columns(); track column.key) {
                <td
                  class="px-4 py-3 text-ink"
                  [class.text-right]="column.numeric"
                  [class.font-mono]="column.numeric"
                  [class.tabular-nums]="column.numeric"
                >
                  @if (cellTemplate(column.key); as template) {
                    <ng-container
                      [ngTemplateOutlet]="template"
                      [ngTemplateOutletContext]="{ $implicit: row }"
                    />
                  } @else {
                    {{ cellValue(row, column.key) }}
                  }
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class DataTable<T extends object> {
  /** Screen-reader summary of what the table contains, e.g. "Your applications". */
  readonly caption = input.required<string>();
  readonly columns = input.required<readonly TableColumn[]>();
  readonly rows = input.required<readonly T[]>();
  /** Property used to track rows across updates; falls back to index. */
  readonly rowKey = input<keyof T | ''>('');

  private readonly cellDefs = contentChildren(CellDef);

  private readonly cellTemplates = computed(() => {
    const map = new Map<string, TemplateRef<{ $implicit: T }>>();
    for (const def of this.cellDefs()) {
      map.set(def.appCell(), def.template);
    }
    return map;
  });

  protected cellTemplate(key: string): TemplateRef<{ $implicit: T }> | undefined {
    return this.cellTemplates().get(key);
  }

  protected cellValue(row: T, key: string): unknown {
    return (row as Record<string, unknown>)[key];
  }

  protected trackRow(index: number, row: T): unknown {
    const key = this.rowKey();
    return key ? row[key] : index;
  }
}
