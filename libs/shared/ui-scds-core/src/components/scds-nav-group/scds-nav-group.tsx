import { Component, Prop, State, h } from '@stencil/core';
import { ScdsIconName } from '../scds-icon/scds-icon-paths';

let nextId = 0;

/**
 * Expandable category item (icon + label + chevron + children). Default
 * slot holds scds-nav-link children. `disabled` renders an inert row for
 * categories with no backing app in this family (Health/Recreation-Sport/
 * Travel/Education) -- no expand affordance, dimmed, no children rendered.
 */
@Component({
  tag: 'scds-nav-group',
  styleUrl: 'scds-nav-group.css',
  shadow: true,
})
export class ScdsNavGroup {
  private readonly contentId = `scds-nav-group-content-${nextId++}`;

  @Prop() label!: string;
  @Prop() iconName?: ScdsIconName;
  @Prop() expanded = false;
  @Prop() disabled = false;

  @State() isExpanded = this.expanded;

  private toggle = (): void => {
    this.isExpanded = !this.isExpanded;
  };

  render() {
    if (this.disabled) {
      return (
        <div class="scds-nav-group scds-nav-group--disabled" aria-disabled="true">
          {this.iconName && <scds-icon name={this.iconName} size="sm"></scds-icon>}
          <span class="scds-nav-group__label">{this.label}</span>
        </div>
      );
    }

    return (
      <div class="scds-nav-group">
        <button
          class="scds-nav-group__trigger"
          type="button"
          aria-expanded={this.isExpanded ? 'true' : 'false'}
          aria-controls={this.contentId}
          onClick={this.toggle}
        >
          {this.iconName && <scds-icon name={this.iconName} size="sm"></scds-icon>}
          <span class="scds-nav-group__label">{this.label}</span>
          <scds-icon
            name="chevron-down"
            size="sm"
            class={`scds-nav-group__chevron${this.isExpanded ? ' scds-nav-group__chevron--open' : ''}`}
          ></scds-icon>
        </button>
        <div class="scds-nav-group__content" id={this.contentId} hidden={!this.isExpanded}>
          <slot></slot>
        </div>
      </div>
    );
  }
}
