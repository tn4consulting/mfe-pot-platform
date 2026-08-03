import { Component, Prop, h, Fragment } from '@stencil/core';

export interface ScdsListColumn {
  id: string;
  header: string;
  cell: (item: unknown) => string;
  /** 'secondary' columns collapse onto their own sub-line when stacked. */
  priority?: 'primary' | 'secondary';
}

/**
 * A multi-column list for data GCDS has no component for (e.g. tasks,
 * documents) that isn't a literal table (`gcds-table`). Real `<ul>`/`<li>`
 * markup with CSS Grid columns at wide viewports, collapsing to stacked
 * "label: value" rows at GCDS's own 48em breakpoint. Each cell's column
 * header is always present as real text (visually hidden at wide
 * viewports, shown inline once stacked) rather than relying on
 * CSS-generated content, since this is a list, not a `<table>`, so there's
 * no native mechanism associating a cell with its column header for
 * assistive tech otherwise.
 *
 * `items`/`columns`/`trackBy` are DOM properties, not HTML attributes
 * (they're non-primitive) -- set them via the element's JS properties, not
 * as JSX/HTML attribute strings. Framework-agnostic (Stencil, shadow DOM).
 * The Angular-only `column.template` `TemplateRef` escape hatch that
 * existed on the hand-written predecessor of this component is
 * deliberately dropped here -- no web-component equivalent, and no real
 * consumer needs it (see mfe-pot-platform's TODO/plan history).
 */
@Component({
  tag: 'scds-multi-column-list',
  styleUrl: 'scds-multi-column-list.css',
  shadow: true,
})
export class ScdsMultiColumnList {
  @Prop() items: unknown[] = [];
  @Prop() columns: ScdsListColumn[] = [];
  @Prop() trackBy: (item: unknown) => unknown = (item) => item;
  @Prop() emptyLabel = 'No items.';
  @Prop() listLabel?: string;

  render() {
    if (this.items.length === 0) {
      return <p class="scds-list__empty">{this.emptyLabel}</p>;
    }

    const columnCountStyle = { '--scds-list-column-count': String(this.columns.length) };

    return (
      <Fragment>
        <div class="scds-list__header" style={columnCountStyle} aria-hidden="true">
          {this.columns.map((column) => (
            <div class="scds-list__header-cell" key={column.id}>
              {column.header}
            </div>
          ))}
        </div>
        <ul class="scds-list" role="list" style={columnCountStyle} aria-label={this.listLabel}>
          {this.items.map((item) => (
            <li class="scds-list__row" role="listitem" key={String(this.trackBy(item))}>
              {this.columns.map((column) => (
                <div
                  class={{
                    'scds-list__cell': true,
                    'scds-list__cell--secondary': column.priority === 'secondary',
                  }}
                  key={column.id}
                >
                  <span class="scds-list__cell-label">{column.header}: </span>
                  <span class="scds-list__cell-value">{column.cell(item)}</span>
                </div>
              ))}
            </li>
          ))}
        </ul>
      </Fragment>
    );
  }
}
