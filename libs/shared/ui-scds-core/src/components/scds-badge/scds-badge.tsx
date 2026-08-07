import { Component, Prop, h } from '@stencil/core';
import { ScdsBadgeTone } from './scds-badge-types';
import { ScdsIconName } from '../scds-icon/scds-icon-paths';

const TONE_ICON: Record<ScdsBadgeTone, ScdsIconName> = {
  danger: 'alert-circle',
  info: 'info-circle',
  success: 'check-circle',
  warning: 'warning-triangle',
  neutral: 'info-circle',
};

/**
 * Status/severity badge or pill -- extracted from scds-card's original
 * inline badge logic. `variant="subtle"` drives Needs Attention's badges
 * (Expiring soon/Reminder/Not Secure/Active/Inactive); `variant="pill"`
 * drives Payments Activity's status pills (Pending/Complete). Both variants
 * share the same tone->color-pair mapping, so contrast is verified once
 * (tokens.contrast.spec.ts) and never re-composed by a consumer.
 */
@Component({
  tag: 'scds-badge',
  styleUrl: 'scds-badge.css',
  shadow: true,
})
export class ScdsBadge {
  @Prop() tone: ScdsBadgeTone = 'neutral';
  @Prop() label!: string;
  @Prop() variant: 'subtle' | 'pill' = 'subtle';
  /** Pills (short status words) skip the tone icon by default -- keep it for a subtle badge that needs the extra visual weight. */
  @Prop() showIcon = true;

  render() {
    return (
      <span class={`scds-badge scds-badge--${this.variant} scds-badge--${this.tone}`} role="status">
        {this.showIcon && this.variant === 'subtle' && (
          <scds-icon name={TONE_ICON[this.tone]} size="sm"></scds-icon>
        )}
        {this.label}
      </span>
    );
  }
}
