import { Component, Prop, Event, EventEmitter, h } from '@stencil/core';

export type ScdsCardTone = 'info' | 'success' | 'warning' | 'danger';

const TONE_ICON: Record<ScdsCardTone, string> = {
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
 *
 * Framework-agnostic (Stencil, shadow DOM). Angular consumers get a typed
 * wrapper via @tn4consulting/shared-ui-scds (auto-generated from this
 * package); other frameworks (e.g. React) use this custom element directly.
 */
@Component({
  tag: 'scds-card',
  styleUrl: 'scds-card.css',
  shadow: true,
})
export class ScdsCard {
  @Prop() cardTitle!: string;
  @Prop() cardTitleTag: 'h3' | 'h4' | 'h5' | 'h6' = 'h3';
  @Prop() description?: string;
  @Prop() href?: string;
  @Prop() rel?: string;
  @Prop() target?: string;
  @Prop() imgSrc?: string;
  @Prop() imgAlt?: string;
  @Prop() tone?: ScdsCardTone;
  @Prop() toneLabel?: string;

  /** Re-emits `gcds-card`'s own `gcdsClick` (fired only in link mode). */
  @Event() scdsClick!: EventEmitter<string>;

  private bindGcdsClick = (el: Element | undefined): void => {
    if (!el || (el as unknown as { __scdsBound?: boolean }).__scdsBound) {
      return;
    }
    (el as unknown as { __scdsBound?: boolean }).__scdsBound = true;
    el.addEventListener('gcdsClick', (event: Event) => {
      this.scdsClick.emit((event as CustomEvent<string>).detail);
    });
  };

  private renderBadge() {
    if (!this.tone) {
      return null;
    }
    return (
      <span class={`scds-card__badge scds-card__badge--${this.tone}`} role="status">
        <gcds-icon name={TONE_ICON[this.tone]} size="text-small" margin-right="100"></gcds-icon>
        {this.toneLabel}
      </span>
    );
  }

  render() {
    const badge = this.renderBadge();

    if (this.href) {
      return (
        <gcds-card
          ref={this.bindGcdsClick}
          card-title={this.cardTitle}
          card-title-tag={this.cardTitleTag}
          description={this.description ?? ''}
          href={this.href}
          rel={this.rel}
          target={this.target}
          img-src={this.imgSrc ?? ''}
          img-alt={this.imgAlt ?? ''}
        >
          {badge}
          <slot name="scdsCardIcon"></slot>
          <slot></slot>
          <div class="scds-card__actions">
            <slot name="scdsCardActions"></slot>
          </div>
        </gcds-card>
      );
    }

    return (
      <div class="scds-card scds-card--static">
        {this.imgSrc ? <img src={this.imgSrc} alt={this.imgAlt ?? ''} class="scds-card__image" /> : null}
        <gcds-heading tag={this.cardTitleTag} margin-top="0">
          {this.cardTitle}
        </gcds-heading>
        {this.description ? <gcds-text margin-bottom="0">{this.description}</gcds-text> : null}
        {badge}
        <slot name="scdsCardIcon"></slot>
        <slot></slot>
        <div class="scds-card__actions">
          <slot name="scdsCardActions"></slot>
        </div>
      </div>
    );
  }
}
