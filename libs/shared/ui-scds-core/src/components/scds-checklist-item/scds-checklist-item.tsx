import { Component, Prop, h } from '@stencil/core';

/**
 * One row in a `scds-checklist` -- a title/description pair, a leading
 * complete/incomplete marker, and a default slot for whatever interactive
 * control actually drives completion (a checkbox, a link that becomes a
 * status link once complete, or an embedded widget from another app).
 * Deliberately owns no completion state of its own -- `complete` is fully
 * caller-controlled, the same "presentational, state lives in the
 * consumer" shape as `scds-badge`'s `tone`. First consumer:
 * mfe-pot-employment-life-events-mfe's guided-journey checklist, where
 * some items are self-reported and others derive completion from another
 * federated app's real data -- this component doesn't need to know which.
 */
@Component({
  tag: 'scds-checklist-item',
  styleUrl: 'scds-checklist-item.css',
  shadow: true,
})
export class ScdsChecklistItem {
  @Prop() itemTitle!: string;
  @Prop() description?: string;
  @Prop() complete = false;
  /** Announced (visually hidden) alongside the title once complete -- caller-supplied so it's bilingual, same as scds-badge's own `label`. */
  @Prop() completeLabel?: string;

  render() {
    return (
      <div class="scds-checklist-item" role="listitem">
        <span class="scds-checklist-item__marker" aria-hidden="true">
          {this.complete ? (
            <scds-icon name="check-circle" size="md"></scds-icon>
          ) : (
            <span class="scds-checklist-item__marker-empty"></span>
          )}
        </span>
        <div class="scds-checklist-item__body">
          <p class="scds-checklist-item__title">
            {this.itemTitle}
            {this.complete && this.completeLabel ? (
              <span class="scds-checklist-item__visually-hidden"> — {this.completeLabel}</span>
            ) : null}
          </p>
          {this.description ? <p class="scds-checklist-item__description">{this.description}</p> : null}
          <div class="scds-checklist-item__action">
            <slot></slot>
          </div>
        </div>
      </div>
    );
  }
}
