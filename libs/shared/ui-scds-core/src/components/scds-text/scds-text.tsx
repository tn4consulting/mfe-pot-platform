import { Component, Prop, h } from '@stencil/core';

/** Replaces gcds-text. */
@Component({
  tag: 'scds-text',
  styleUrl: 'scds-text.css',
  shadow: true,
})
export class ScdsText {
  @Prop() tag: 'p' | 'span' = 'p';
  @Prop() size: 'small' | 'base' = 'base';

  render() {
    const Tag = this.tag;
    return (
      <Tag class={`scds-text scds-text--${this.size}`}>
        <slot></slot>
      </Tag>
    );
  }
}
