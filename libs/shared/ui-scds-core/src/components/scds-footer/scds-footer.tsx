import { Component, h } from '@stencil/core';

/**
 * Dark-navy 3-column footer + bottom row + wordmark. Replaces gcds-footer.
 * Layout-driven by slotted content rather than a prop-configured variant
 * (gcds-footer's `display`/`contextual-heading` attributes have no
 * equivalent here) -- the consuming app supplies its own link markup per
 * column, this component only supplies the shared visual chrome.
 */
@Component({
  tag: 'scds-footer',
  styleUrl: 'scds-footer.css',
  shadow: true,
})
export class ScdsFooter {
  render() {
    return (
      <footer class="scds-footer">
        <div class="scds-footer__columns">
          <div class="scds-footer__column">
            <slot name="column-1"></slot>
          </div>
          <div class="scds-footer__column">
            <slot name="column-2"></slot>
          </div>
          <div class="scds-footer__column">
            <slot name="column-3"></slot>
          </div>
        </div>
        <div class="scds-footer__bottom">
          <div class="scds-footer__bottom-links">
            <slot name="bottom"></slot>
          </div>
          <div class="scds-footer__wordmark" aria-hidden="true">
            <span class="scds-footer__wordmark-bar"></span>
            Canada
          </div>
        </div>
      </footer>
    );
  }
}
