import { Component, Input, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ScdsListColumn<T> {
  id: string;
  header: string;
  cell?: (item: T) => string;
  template?: TemplateRef<{ $implicit: T; column: ScdsListColumn<T> }>;
  /** 'secondary' columns collapse onto their own sub-line when stacked on a narrow viewport. */
  priority?: 'primary' | 'secondary';
}

/**
 * A multi-column list for data GCDS has no component for (e.g. tasks,
 * documents) that isn't a literal table (`gcds-table`). Real `<ul>`/`<li>`
 * markup with CSS Grid columns at wide viewports, collapsing to stacked
 * "label: value" rows at GCDS's own 48em breakpoint. Each cell's column
 * header is always present as real text (visually hidden at wide viewports,
 * shown inline once stacked) rather than relying on CSS-generated content,
 * since this is a list, not a `<table>`, so there's no native mechanism
 * associating a cell with its column header for assistive tech otherwise.
 */
@Component({
  selector: 'scds-multi-column-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scds-multi-column-list.html',
  styleUrl: './scds-multi-column-list.css',
})
export class ScdsMultiColumnList<T> {
  @Input({ required: true }) items: T[] = [];
  @Input({ required: true }) columns: ScdsListColumn<T>[] = [];
  @Input() trackBy: (item: T) => unknown = (item) => item;
  @Input() emptyLabel = 'No items.';
  @Input() listLabel?: string;
  @Input() listLabelledBy?: string;

  protected cellValue(column: ScdsListColumn<T>, item: T): string {
    return column.cell ? column.cell(item) : '';
  }
}
