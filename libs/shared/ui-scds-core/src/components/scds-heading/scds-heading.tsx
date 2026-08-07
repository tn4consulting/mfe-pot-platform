import { Component, Prop, h } from '@stencil/core';

/** Replaces gcds-heading. */
@Component({
  tag: 'scds-heading',
  styleUrl: 'scds-heading.css',
  shadow: true,
})
export class ScdsHeading {
  @Prop() tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' = 'h2';

  render() {
    const Tag = this.tag;
    return (
      <Tag class="scds-heading">
        <slot></slot>
      </Tag>
    );
  }
}
