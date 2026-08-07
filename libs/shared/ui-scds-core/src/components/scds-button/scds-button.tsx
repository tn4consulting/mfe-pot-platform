import { Component, Prop, h } from '@stencil/core';

/** Replaces gcds-button. A small surface deliberately -- scds-link takes over most former card-action button use (see scds-link). */
@Component({
  tag: 'scds-button',
  styleUrl: 'scds-button.css',
  shadow: true,
})
export class ScdsButton {
  @Prop() variant: 'primary' | 'secondary' = 'primary';
  @Prop() size: 'small' | 'regular' = 'regular';
  @Prop() type: 'button' | 'submit' | 'reset' = 'button';
  @Prop() disabled = false;

  render() {
    return (
      <button
        class={`scds-button scds-button--${this.variant} scds-button--${this.size}`}
        type={this.type}
        disabled={this.disabled}
      >
        <slot></slot>
      </button>
    );
  }
}
