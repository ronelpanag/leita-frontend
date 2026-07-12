import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TextInput } from './text-input';

@Component({
  imports: [TextInput, ReactiveFormsModule],
  template: `<app-text-input label="Email" type="email" [formControl]="control" />`,
})
class Host {
  readonly control = new FormControl('', { nonNullable: true });
}

describe('TextInput', () => {
  it('associates the label with the input', async () => {
    await render(Host);
    expect(screen.getByLabelText('Email')).toBeTruthy();
  });

  it('propagates typed values to the form control', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(Host);
    await user.type(screen.getByLabelText('Email'), 'nora@leita.no');
    expect(fixture.componentInstance.control.value).toBe('nora@leita.no');
  });

  it('reflects programmatic form control values', async () => {
    const { fixture } = await render(Host);
    fixture.componentInstance.control.setValue('bjorn@leita.no');
    fixture.detectChanges();
    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('bjorn@leita.no');
  });

  it('wires the error message via aria-describedby and aria-invalid', async () => {
    await render(`<app-text-input label="Email" [error]="error" />`, {
      imports: [TextInput],
      componentProperties: { error: 'Enter a valid email address.' },
    });
    const input = screen.getByLabelText('Email');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const errorEl = document.getElementById(describedBy as string);
    expect(errorEl?.textContent).toContain('Enter a valid email address.');
  });

  it('disables the input via the form control', async () => {
    const { fixture } = await render(Host);
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect((screen.getByLabelText('Email') as HTMLInputElement).disabled).toBe(true);
  });
});
