import { Component, Fragment, Prop, h } from '@stencil/core';
import { ScdsIconName } from '../scds-icon/scds-icon-paths';

/**
 * Leaf nav item, real or inert. Replaces gcds-nav-link -- the app's
 * existing AppNavLink click-intercept wrapper (preventDefault + React
 * Router navigate()) attaches its onClick to this host element the same
 * way it did for gcds-nav-link, since the click event is composed and
 * bubbles across the shadow boundary from the internal <a>.
 *
 * `disabled` renders an inert row (categories with no backing app in this
 * family, e.g. Health/Travel) -- no href, no click handling, dimmed. When
 * not disabled and `href` is omitted, renders a real <button> instead of
 * an anchor with no href (which wouldn't be keyboard-focusable/operable)
 * -- for a real nav action that isn't a navigation, e.g. shell's Log Out.
 */
@Component({
  tag: 'scds-nav-link',
  styleUrl: 'scds-nav-link.css',
  shadow: true,
})
export class ScdsNavLink {
  @Prop() href?: string;
  @Prop() iconName?: ScdsIconName;
  @Prop() current = false;
  @Prop() disabled = false;

  render() {
    const content = (
      <Fragment>
        {this.iconName && <scds-icon name={this.iconName} size="sm"></scds-icon>}
        <span class="scds-nav-link__label">
          <slot></slot>
        </span>
      </Fragment>
    );

    if (this.disabled) {
      return (
        <span class="scds-nav-link scds-nav-link--disabled" aria-disabled="true">
          {content}
        </span>
      );
    }

    if (!this.href) {
      return (
        <button class="scds-nav-link scds-nav-link--button" type="button">
          {content}
        </button>
      );
    }

    return (
      <a
        class={`scds-nav-link${this.current ? ' scds-nav-link--current' : ''}`}
        href={this.href}
        aria-current={this.current ? 'page' : undefined}
      >
        {content}
      </a>
    );
  }
}
