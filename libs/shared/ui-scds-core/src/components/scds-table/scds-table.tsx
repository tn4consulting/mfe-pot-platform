import { Component, Prop, h } from '@stencil/core';

/**
 * Styling shell around a real, app-authored semantic <table> passed in via
 * the default slot -- keeps the existing accessible markup (<caption>,
 * <th scope="col">) fully under the consuming app's control, this
 * component only supplies shared visual styling (used by
 * dashboard's Payments Activity table).
 *
 * Deliberately shadow:false (scoped CSS instead) -- unlike every other
 * scds-* component, this one needs descendant selectors reaching into the
 * app-authored table's own thead/tbody/th/td, and ::slotted() in a real
 * shadow tree can only match the directly slotted element itself, never
 * its descendants.
 */
@Component({
  tag: 'scds-table',
  styleUrl: 'scds-table.css',
  shadow: false,
  scoped: true,
})
export class ScdsTable {
  @Prop() dense = false;

  render() {
    return (
      <div class={`scds-table-wrapper${this.dense ? ' scds-table-wrapper--dense' : ''}`}>
        <slot></slot>
      </div>
    );
  }
}
