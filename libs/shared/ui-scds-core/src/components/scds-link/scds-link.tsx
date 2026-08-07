import { Component, Prop, h } from '@stencil/core';
import { ScdsIconName } from '../scds-icon/scds-icon-paths';

/**
 * Text link with an optional leading/trailing icon -- matches the
 * screenshot's "Apply for CDCP ->" / "Edit Profile ->" style. Replaces the
 * gcds-button previously used in ConsiderThisList's card actions, which was
 * visually wrong for this design (a secondary button, not a text link).
 */
@Component({
  tag: 'scds-link',
  styleUrl: 'scds-link.css',
  shadow: true,
})
export class ScdsLink {
  @Prop() href!: string;
  @Prop() iconName?: ScdsIconName;
  @Prop() iconPosition: 'start' | 'end' = 'end';

  render() {
    const icon = this.iconName ? <scds-icon name={this.iconName} size="sm"></scds-icon> : null;
    return (
      <a class="scds-link" href={this.href}>
        {this.iconPosition === 'start' && icon}
        <span class="scds-link__label">
          <slot></slot>
        </span>
        {this.iconPosition === 'end' && icon}
      </a>
    );
  }
}
