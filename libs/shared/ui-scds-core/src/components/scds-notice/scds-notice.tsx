import { Component, Prop, h } from '@stencil/core';
import { ScdsBadgeTone } from '../scds-badge/scds-badge-types';

/**
 * Left-accent-border block. Replaces gcds-notice for dashboard's single
 * "What's New?" card (see docs/msca-screenshots/dashboard.png) -- distinct
 * from NeedsAttentionList, which moved to scds-card + scds-badge to match
 * the screenshot's per-item card shape instead.
 */
@Component({
  tag: 'scds-notice',
  styleUrl: 'scds-notice.css',
  shadow: true,
})
export class ScdsNotice {
  @Prop() noticeTitle!: string;
  @Prop() titleTag: 'h2' | 'h3' | 'h4' = 'h3';
  @Prop() tone: ScdsBadgeTone = 'info';

  render() {
    return (
      <div class={`scds-notice scds-notice--${this.tone}`} role="note">
        <scds-heading tag={this.titleTag}>{this.noticeTitle}</scds-heading>
        <div class="scds-notice__body">
          <slot></slot>
        </div>
      </div>
    );
  }
}
