import { Component, Prop, Event, EventEmitter, h } from '@stencil/core';

let nextId = 0;

/**
 * Labeled single-line text control -- the first of the EI-application-form
 * primitives (see scds-picker/scds-currency-input/scds-progress-bar,
 * added alongside it). `value` stays a caller-controlled prop (same
 * "presentational, state lives in the consumer" shape as scds-badge's
 * `tone`) rather than internal state, so a consuming wizard can validate
 * and re-render `error` on every keystroke without fighting this
 * component for ownership of the value.
 */
@Component({
  tag: 'scds-text-input',
  styleUrl: 'scds-text-input.css',
  shadow: true,
})
export class ScdsTextInput {
  private readonly inputId = `scds-text-input-${++nextId}`;
  private readonly hintId = `${this.inputId}-hint`;
  private readonly errorId = `${this.inputId}-error`;

  @Prop() label!: string;
  @Prop() value = '';
  @Prop() type: 'text' | 'tel' | 'email' | 'date' = 'text';
  @Prop() hint?: string;
  @Prop() error?: string;
  @Prop() required = false;
  @Prop() autocomplete?: string;
  @Prop() placeholder?: string;
  @Prop() maxlength?: number;
  @Prop() disabled = false;

  /** Emitted on every keystroke -- for a controlled-value wizard field re-rendering `value` on each change. */
  @Event() scdsInput!: EventEmitter<string>;
  /** Emitted on blur/native change -- for validation that should only run once a field is "committed". */
  @Event() scdsChange!: EventEmitter<string>;

  private handleInput = (event: Event): void => {
    this.scdsInput.emit((event.target as HTMLInputElement).value);
  };

  private handleChange = (event: Event): void => {
    this.scdsChange.emit((event.target as HTMLInputElement).value);
  };

  private describedBy(): string | undefined {
    const ids = [this.hint ? this.hintId : null, this.error ? this.errorId : null].filter(
      (id): id is string => id !== null,
    );
    return ids.length ? ids.join(' ') : undefined;
  }

  render() {
    return (
      <div class="scds-text-input">
        <label class="scds-text-input__label" htmlFor={this.inputId}>
          {this.label}
          {this.required ? (
            <span class="scds-text-input__required" aria-hidden="true">
              {' '}
              *
            </span>
          ) : null}
        </label>
        {this.hint ? (
          <p class="scds-text-input__hint" id={this.hintId}>
            {this.hint}
          </p>
        ) : null}
        <input
          class={`scds-text-input__control${this.error ? ' scds-text-input__control--error' : ''}`}
          id={this.inputId}
          type={this.type}
          value={this.value}
          placeholder={this.placeholder}
          autocomplete={this.autocomplete}
          maxlength={this.maxlength}
          disabled={this.disabled}
          required={this.required}
          aria-invalid={this.error ? 'true' : undefined}
          aria-describedby={this.describedBy()}
          onInput={this.handleInput}
          onChange={this.handleChange}
        />
        {this.error ? (
          <p class="scds-text-input__error" id={this.errorId} role="alert">
            {this.error}
          </p>
        ) : null}
      </div>
    );
  }
}
