import { Component, h } from '@stencil/core';

/**
 * Replaces gcds-breadcrumbs. Children are scds-breadcrumbs-item elements --
 * unlike GCDS, there's no built-in "Canada.ca" crumb; the consuming app
 * passes every crumb explicitly (see dashboard's Overview.tsx), including
 * its own Home item.
 */
@Component({
  tag: 'scds-breadcrumbs',
  styleUrl: 'scds-breadcrumbs.css',
  shadow: true,
})
export class ScdsBreadcrumbs {
  render() {
    return (
      <nav class="scds-breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <slot></slot>
        </ol>
      </nav>
    );
  }
}
