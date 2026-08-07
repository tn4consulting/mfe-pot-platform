import { Component, Prop, Event, EventEmitter, h } from '@stencil/core';
import { ScdsBadgeTone } from '../scds-badge/scds-badge-types';

/**
 * A card that renders with or without a destination link -- unlike the
 * GCDS equivalent this used to delegate to, both a static variant (no
 * `href`) and a severity tone badge (via scds-badge) are first-class here,
 * not bolted on. Public attribute/slot/event contract is unchanged from
 * the GCDS-delegating version: job-bank and employment-insurance depend on
 * it unmodified.
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
  @Prop() tone?: ScdsBadgeTone;
  @Prop() toneLabel?: string;

  @Event() scdsClick!: EventEmitter<string>;

  private handleClick = (): void => {
    if (this.href) {
      this.scdsClick.emit(this.href);
    }
  };

  private renderBadge() {
    if (!this.tone) {
      return null;
    }
    return <scds-badge tone={this.tone} label={this.toneLabel ?? ''} variant="subtle"></scds-badge>;
  }

  private renderBody() {
    return (
      <div class="scds-card__body">
        {this.imgSrc ? <img src={this.imgSrc} alt={this.imgAlt ?? ''} class="scds-card__image" /> : null}
        {this.renderBadge()}
        <slot name="scdsCardIcon"></slot>
        <scds-heading tag={this.cardTitleTag}>{this.cardTitle}</scds-heading>
        {this.description ? <scds-text>{this.description}</scds-text> : null}
        <slot></slot>
        <div class="scds-card__actions">
          <slot name="scdsCardActions"></slot>
        </div>
      </div>
    );
  }

  render() {
    if (this.href) {
      return (
        <a class="scds-card scds-card--link" href={this.href} rel={this.rel} target={this.target} onClick={this.handleClick}>
          {this.renderBody()}
        </a>
      );
    }

    return <div class="scds-card scds-card--static">{this.renderBody()}</div>;
  }
}
