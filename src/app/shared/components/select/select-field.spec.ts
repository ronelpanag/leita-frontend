import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { SelectField, type SelectOption } from './select-field';

const STAGES: readonly SelectOption[] = [
  { value: 'screening', label: 'Screening' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer', disabled: true },
];

@Component({
  imports: [SelectField, ReactiveFormsModule],
  template: `
    <app-select-field
      label="Stage"
      placeholder="Choose a stage…"
      [options]="options"
      [formControl]="control"
    />
  `,
})
class Host {
  readonly options = STAGES;
  readonly control = new FormControl('', { nonNullable: true });
}

describe('SelectField', () => {
  it('renders a labelled native select with all options', async () => {
    await render(Host);
    const select = screen.getByLabelText('Stage');
    expect(select.tagName).toBe('SELECT');
    expect(screen.getByRole('option', { name: 'Interview' })).toBeTruthy();
    expect((screen.getByRole('option', { name: 'Offer' }) as HTMLOptionElement).disabled).toBe(
      true,
    );
  });

  it('propagates the chosen option to the form control', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(Host);
    await user.selectOptions(screen.getByLabelText('Stage'), 'interview');
    expect(fixture.componentInstance.control.value).toBe('interview');
  });

  it('shows the placeholder as a disabled option', async () => {
    await render(Host);
    const placeholder = screen.getByRole('option', {
      name: 'Choose a stage…',
    }) as HTMLOptionElement;
    expect(placeholder.disabled).toBe(true);
    expect(placeholder.value).toBe('');
  });

  it('reflects a programmatic value and a disabled form control', async () => {
    const { fixture } = await render(Host);
    fixture.componentInstance.control.setValue('offer');
    fixture.detectChanges();
    expect((screen.getByLabelText('Stage') as HTMLSelectElement).value).toBe('offer');

    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect((screen.getByLabelText('Stage') as HTMLSelectElement).disabled).toBe(true);
  });

  it('surfaces an inline error via aria-describedby', async () => {
    await render(
      `<app-select-field label="Stage" [options]="options" [error]="'Pick a stage.'" />`,
      { imports: [SelectField], componentProperties: { options: STAGES } },
    );
    const select = screen.getByLabelText('Stage');
    expect(select.getAttribute('aria-invalid')).toBe('true');
    const describedBy = select.getAttribute('aria-describedby');
    expect(document.getElementById(describedBy as string)?.textContent).toContain('Pick a stage.');
  });
});
