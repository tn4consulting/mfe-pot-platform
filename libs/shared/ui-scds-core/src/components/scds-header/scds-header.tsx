import { Component, Prop, h } from '@stencil/core';

/**
 * Top app bar: brand/title + skip link + slotted content. Replaces
 * gcds-header + gcds-signature. Unlike gcds-header, there's no `menu`
 * slot -- the nav moved into scds-sidebar entirely -- and no `toggle`
 * slot -- the language switch is plain JSX rendered by the consuming app
 * inside the `account` slot alongside scds-user-menu (see AppFrame.tsx).
 * `nav-toggle` is a dedicated slot for the app's own hamburger button,
 * since sidebar open/close state is owned by the app (AppFrame.tsx), not
 * this component.
 */
@Component({
  tag: 'scds-header',
  styleUrl: 'scds-header.css',
  shadow: true,
})
export class ScdsHeader {
  @Prop() appTitle!: string;
  @Prop() skipToHref?: string;

  render() {
    return (
      <header class="scds-header">
        {this.skipToHref && (
          <a class="scds-header__skip-link" href={this.skipToHref}>
            Skip to main content
          </a>
        )}
        <div class="scds-header__bar">
          <div class="scds-header__start">
            <slot name="nav-toggle"></slot>
          </div>
          <a class="scds-header__brand" href="/">
            <span class="scds-header__brand-mark" aria-hidden="true"></span>
            <span class="scds-header__title">{this.appTitle}</span>
          </a>
          <div class="scds-header__end">
            <slot name="account"></slot>
          </div>
        </div>
      </header>
    );
  }
}
