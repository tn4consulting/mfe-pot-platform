import { Component, Prop, State, Event, EventEmitter, Element, Fragment, h } from '@stencil/core';

interface PickerOption {
  value: string;
  label: string;
}

let nextId = 0;

/**
 * Single-choice control for the EI application wizard's enumerated
 * questions (Yes/No eligibility screens, reason for separation, pay
 * period, education level, preferred language, ...). Options are
 * `scds-picker-option` light-DOM children, not a JSON-string or
 * imperative-property prop -- see scds-picker-option's own comment for
 * why this fits the family's existing `scds-breadcrumbs`/
 * `scds-breadcrumbs-item` compositional idiom better than
 * `scds-multi-column-list`'s approach.
 *
 * Options are read **once**, in `componentWillLoad`, not kept in sync via
 * `slotchange`/`MutationObserver` -- every real consumer in this family
 * passes a static option list authored directly in JSX (the option set
 * for "reason for separation" never changes at runtime). If a future
 * consumer needs a dynamically-changing option set after mount, that's
 * the point to add slot-change handling; not needed today.
 */
@Component({
  tag: 'scds-picker',
  styleUrl: 'scds-picker.css',
  shadow: true,
})
export class ScdsPicker {
  @Element() el!: HTMLElement;
  private readonly controlId = `scds-picker-${++nextId}`;
  private readonly hintId = `${this.controlId}-hint`;
  private readonly errorId = `${this.controlId}-error`;

  @Prop() label!: string;
  @Prop() value?: string;
  @Prop() display: 'radio' | 'select' = 'radio';
  @Prop() hint?: string;
  @Prop() error?: string;
  @Prop() required = false;
  @Prop() name = this.controlId;
  @Prop() placeholder = 'Select an option';

  @State() private options: PickerOption[] = [];

  @Event() scdsChange!: EventEmitter<string>;

  componentWillLoad(): void {
    this.options = Array.from(this.el.querySelectorAll('scds-picker-option')).map((option) => ({
      value: option.getAttribute('value') ?? '',
      label: option.textContent?.trim() ?? '',
    }));
  }

  private handleRadioChange = (optionValue: string): void => {
    this.scdsChange.emit(optionValue);
  };

  private handleSelectChange = (event: Event): void => {
    this.scdsChange.emit((event.target as HTMLSelectElement).value);
  };

  private describedBy(): string | undefined {
    const ids = [this.hint ? this.hintId : null, this.error ? this.errorId : null].filter(
      (id): id is string => id !== null,
    );
    return ids.length ? ids.join(' ') : undefined;
  }

  private renderRadios() {
    return (
      <fieldset class="scds-picker__fieldset" aria-describedby={this.describedBy()}>
        <legend class="scds-picker__legend">
          {this.label}
          {this.required ? (
            <span class="scds-picker__required" aria-hidden="true">
              {' '}
              *
            </span>
          ) : null}
        </legend>
        <div class="scds-picker__options">
          {this.options.map((option) => (
            <label class="scds-picker__radio-label" key={option.value}>
              <input
                type="radio"
                class="scds-picker__radio"
                name={this.name}
                value={option.value}
                checked={this.value === option.value}
                required={this.required}
                onChange={() => this.handleRadioChange(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  private renderSelect() {
    return (
      <Fragment>
        <label class="scds-picker__label" htmlFor={this.controlId}>
          {this.label}
          {this.required ? (
            <span class="scds-picker__required" aria-hidden="true">
              {' '}
              *
            </span>
          ) : null}
        </label>
        <select
          class={`scds-picker__select${this.error ? ' scds-picker__select--error' : ''}`}
          id={this.controlId}
          required={this.required}
          aria-invalid={this.error ? 'true' : undefined}
          aria-describedby={this.describedBy()}
          onChange={this.handleSelectChange}
        >
          <option value="" disabled hidden selected={!this.value}>
            {this.placeholder}
          </option>
          {this.options.map((option) => (
            <option value={option.value} selected={this.value === option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Fragment>
    );
  }

  render() {
    return (
      <div class="scds-picker">
        {this.hint ? (
          <p class="scds-picker__hint" id={this.hintId}>
            {this.hint}
          </p>
        ) : null}
        {this.display === 'radio' ? this.renderRadios() : this.renderSelect()}
        {this.error ? (
          <p class="scds-picker__error" id={this.errorId} role="alert">
            {this.error}
          </p>
        ) : null}
      </div>
    );
  }
}
