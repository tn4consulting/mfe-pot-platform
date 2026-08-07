import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';

/**
 * Collapsible nav container. At >=48em (--scds-breakpoint-sidebar) it's a
 * fixed, always-visible column; below that it becomes an off-canvas drawer
 * controlled by `open`, which the app owns (AppFrame.tsx's own
 * useState) -- this component stays presentational/attribute-driven, same
 * as every other scds-* element. Two named slots keep the category nav
 * and the account/utility nav visually and semantically distinct; a
 * scds-nav-divider between them is up to the consumer to place.
 */
@Component({
  tag: 'scds-sidebar',
  styleUrl: 'scds-sidebar.css',
  shadow: true,
})
export class ScdsSidebar {
  @Prop() open = false;
  @Prop() label = 'Site menu';
  @Event() scdsClose!: EventEmitter<void>;

  private close = (): void => {
    this.scdsClose.emit();
  };

  render() {
    return (
      <div class={`scds-sidebar-root${this.open ? ' scds-sidebar-root--open' : ''}`}>
        <div class="scds-sidebar__overlay" onClick={this.close}></div>
        <aside class="scds-sidebar" aria-label={this.label}>
          <div class="scds-sidebar__header">
            <button class="scds-sidebar__close" type="button" onClick={this.close} aria-label="Close menu">
              <scds-icon name="close"></scds-icon>
            </button>
          </div>
          <nav class="scds-sidebar__nav">
            <div class="scds-sidebar__group">
              <slot name="primary"></slot>
            </div>
            <div class="scds-sidebar__group">
              <slot name="secondary"></slot>
            </div>
          </nav>
        </aside>
      </div>
    );
  }
}
