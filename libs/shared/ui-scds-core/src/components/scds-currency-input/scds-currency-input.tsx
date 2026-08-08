import { Component, Prop, State, Watch, Event, EventEmitter, h } from '@stencil/core';

let nextId = 0;

function formatAmount(value: number): string {
  return value.toFixed(2);
}

function parseAmount(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, '');
  if (trimmed === '') {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * A `$`-prefixed amount field -- e.g. the EI application wizard's "Rate of
 * pay" question. Deliberately `<input inputmode="decimal">`, not
 * `type="number"`: a native number input's browser-dependent spinner/locale
 * formatting fights the fixed-2-decimal formatting this component owns
 * (format-on-blur, raw text while actively typing so a trailing "." or
 * partial "12.5" isn't clobbered mid-keystroke).
 */
@Component({
  tag: 'scds-currency-input',
  styleUrl: 'scds-currency-input.css',
  shadow: true,
})
export class ScdsCurrencyInput {
  private readonly inputId = `scds-currency-input-${++nextId}`;
  private readonly hintId = `${this.inputId}-hint`;
  private readonly errorId = `${this.inputId}-error`;

  @Prop() label!: string;
  @Prop() value?: number;
  @Prop() hint?: string;
  @Prop() error?: string;
  @Prop() required = false;
  @Prop() min?: number;
  @Prop() max?: number;
  @Prop() currencySymbol = '$';
  @Prop() disabled = false;

  /**
   * Raw text while the field has focus; reformatted to 2 decimals on blur.
   * Seeded from `value` in `componentWillLoad`, not a field initializer --
   * an initial attribute (e.g. `value="18"`) isn't guaranteed applied to
   * `this.value` yet at class-construction time, only by the time
   * lifecycle hooks run.
   */
  @State() private displayValue = '';

  @Event() scdsChange!: EventEmitter<number | null>;

  componentWillLoad(): void {
    this.displayValue = this.value === undefined ? '' : formatAmount(this.value);
  }

  @Watch('value')
  onValueChange(value: number | undefined): void {
    this.displayValue = value === undefined ? '' : formatAmount(value);
  }

  private handleInput = (event: Event): void => {
    this.displayValue = (event.target as HTMLInputElement).value;
  };

  private handleBlur = (): void => {
    let parsed = parseAmount(this.displayValue);
    if (parsed !== null) {
      if (this.min !== undefined) {
        parsed = Math.max(this.min, parsed);
      }
      if (this.max !== undefined) {
        parsed = Math.min(this.max, parsed);
      }
      this.displayValue = formatAmount(parsed);
    }
    this.scdsChange.emit(parsed);
  };

  private describedBy(): string | undefined {
    const ids = [this.hint ? this.hintId : null, this.error ? this.errorId : null].filter(
      (id): id is string => id !== null,
    );
    return ids.length ? ids.join(' ') : undefined;
  }

  render() {
    return (
      <div class="scds-currency-input">
        <label class="scds-currency-input__label" htmlFor={this.inputId}>
          {this.label}
          {this.required ? (
            <span class="scds-currency-input__required" aria-hidden="true">
              {' '}
              *
            </span>
          ) : null}
        </label>
        {this.hint ? (
          <p class="scds-currency-input__hint" id={this.hintId}>
            {this.hint}
          </p>
        ) : null}
        <div class={`scds-currency-input__group${this.error ? ' scds-currency-input__group--error' : ''}`}>
          <span class="scds-currency-input__symbol" aria-hidden="true">
            {this.currencySymbol}
          </span>
          <input
            class="scds-currency-input__control"
            id={this.inputId}
            type="text"
            inputmode="decimal"
            value={this.displayValue}
            disabled={this.disabled}
            required={this.required}
            aria-invalid={this.error ? 'true' : undefined}
            aria-describedby={this.describedBy()}
            onInput={this.handleInput}
            onBlur={this.handleBlur}
          />
        </div>
        {this.error ? (
          <p class="scds-currency-input__error" id={this.errorId} role="alert">
            {this.error}
          </p>
        ) : null}
      </div>
    );
  }
}
