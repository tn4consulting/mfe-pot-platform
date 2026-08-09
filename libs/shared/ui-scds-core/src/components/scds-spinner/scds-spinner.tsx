import { Component, Prop, h } from '@stencil/core';

/**
 * Indeterminate loading indicator -- first consumers: shared-federation-
 * runtime's RemoteRouteHost (Suspense fallback while a routed remote's
 * ./Component module downloads) and life-events-mfe's WidgetSlot (while a
 * cross-remote widget loads). `role="status"` (not `role="progressbar"` --
 * unlike scds-progress-bar, there's no known current/total here) gives an
 * implicit aria-live="polite" region, the same mechanism scds-badge already
 * relies on -- the visible `label` text doubles as the accessible name, no
 * separate visually-hidden span needed.
 */
@Component({
  tag: 'scds-spinner',
  styleUrl: 'scds-spinner.css',
  shadow: true,
})
export class ScdsSpinner {
  @Prop() label = 'Loading';
  @Prop() size: 'small' | 'regular' = 'regular';

  render() {
    return (
      <div class={`scds-spinner scds-spinner--${this.size}`} role="status">
        <span class="scds-spinner__ring" aria-hidden="true"></span>
        <span class="scds-spinner__label">{this.label}</span>
      </div>
    );
  }
}
