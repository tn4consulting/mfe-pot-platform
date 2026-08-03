import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GcdsComponentsModule } from '@gcds-core/components-angular';
import type { IconNames } from '@gcds-core/components';

export type ScdsCardTone = 'info' | 'success' | 'warning' | 'danger';

const TONE_ICON: Record<ScdsCardTone, IconNames> = {
  danger: 'exclamation-circle',
  info: 'info-circle',
  success: 'checkmark-circle',
  warning: 'warning-triangle',
};

/**
 * A card that extends `gcds-card` with what it doesn't have: a variant that
 * renders without a destination link (`gcds-card` renders nothing at all if
 * `href` is omitted -- both `cardTitle` and `href` are required props on the
 * underlying Stencil component), a severity tone badge reusing
 * `gcds-notice`'s tone vocabulary/icons, and a footer actions slot.
 */
@Component({
  selector: 'scds-card',
  standalone: true,
  imports: [CommonModule, GcdsComponentsModule],
  templateUrl: './scds-card.html',
  styleUrl: './scds-card.css',
})
export class ScdsCard {
  @Input({ required: true }) cardTitle!: string;
  @Input() cardTitleTag: 'h3' | 'h4' | 'h5' | 'h6' = 'h3';
  @Input() description?: string;
  @Input() href?: string;
  @Input() rel?: string;
  @Input() target?: string;
  @Input() imgSrc?: string;
  @Input() imgAlt?: string;
  @Input() tone?: ScdsCardTone;
  @Input() toneLabel?: string;

  @Output() cardClick = new EventEmitter<string>();

  protected get toneIcon(): IconNames | undefined {
    return this.tone ? TONE_ICON[this.tone] : undefined;
  }
}
