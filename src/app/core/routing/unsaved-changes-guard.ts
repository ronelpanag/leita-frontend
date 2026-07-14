import type { CanDeactivateFn } from '@angular/router';

/** Implemented by form pages that should warn before discarding user input. */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/** Blocks navigation away from dirty forms until the user confirms. */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) =>
  !component.hasUnsavedChanges() ||
  confirm('You have unsaved changes. Leave this page and discard them?');
