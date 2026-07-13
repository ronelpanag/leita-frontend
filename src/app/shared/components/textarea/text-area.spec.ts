import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TextArea } from './text-area';

@Component({
  imports: [TextArea, ReactiveFormsModule],
  template: `<app-text-area label="Cover letter" [optionalHint]="true" [formControl]="control" />`,
})
class Host {
  readonly control = new FormControl('', { nonNullable: true });
}

describe('TextArea', () => {
  it('associates the label and marks the field optional', async () => {
    await render(Host);
    expect(screen.getByLabelText(/Cover letter/)).toBeTruthy();
    expect(screen.getByText('(optional)')).toBeTruthy();
  });

  it('propagates typed values to the form control', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(Host);
    await user.type(screen.getByLabelText(/Cover letter/), 'I know the trail.');
    expect(fixture.componentInstance.control.value).toBe('I know the trail.');
  });

  it('wires errors through aria-describedby', async () => {
    await render(`<app-text-area label="Cover letter" [error]="'Too long.'" />`, {
      imports: [TextArea],
    });
    const textarea = screen.getByLabelText(/Cover letter/);
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    const describedBy = textarea.getAttribute('aria-describedby');
    expect(document.getElementById(describedBy as string)?.textContent).toContain('Too long.');
  });
});
