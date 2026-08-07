import { Component, h } from '@stencil/core';

/** Visual separator between scds-sidebar's primary and secondary nav groups. */
@Component({
  tag: 'scds-nav-divider',
  styleUrl: 'scds-nav-divider.css',
  shadow: true,
})
export class ScdsNavDivider {
  render() {
    return <hr class="scds-nav-divider" />;
  }
}
