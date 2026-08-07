import { Component, Prop, h } from '@stencil/core';

/**
 * A labelled `role="list"` wrapper for `scds-checklist-item` children --
 * consistent spacing/dividers between rows, plus an optional heading
 * rendered via `scds-heading` above the list. `checklistHeading` is
 * optional: omit it when a consumer already renders its own heading
 * immediately before this element (e.g. one page-level `scds-heading`
 * shared across several checklists) -- in that case set `list-label` for
 * screen readers instead, since a `role="list"` with no accessible name
 * announces as just "list".
 */
@Component({
  tag: 'scds-checklist',
  styleUrl: 'scds-checklist.css',
  shadow: true,
})
export class ScdsChecklist {
  @Prop() checklistHeading?: string;
  @Prop() headingTag: 'h2' | 'h3' | 'h4' = 'h3';
  /** Accessible name for the `role="list"` element when `checklistHeading` is omitted. */
  @Prop() listLabel?: string;

  render() {
    return (
      <div class="scds-checklist">
        {this.checklistHeading ? <scds-heading tag={this.headingTag}>{this.checklistHeading}</scds-heading> : null}
        <div class="scds-checklist__list" role="list" aria-label={this.checklistHeading ? undefined : this.listLabel}>
          <slot></slot>
        </div>
      </div>
    );
  }
}
