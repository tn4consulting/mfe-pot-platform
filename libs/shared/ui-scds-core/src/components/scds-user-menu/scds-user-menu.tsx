import { Component, Element, Listen, Prop, State, h } from '@stencil/core';

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/**
 * Avatar/name trigger + dropdown panel. Replaces the ad hoc
 * `<button slot="account">` sign-out control -- the default slot holds
 * plain app-authored menu items (sign-out button, language-switch button),
 * see AppFrame.tsx.
 */
@Component({
  tag: 'scds-user-menu',
  styleUrl: 'scds-user-menu.css',
  shadow: true,
})
export class ScdsUserMenu {
  @Element() host!: HTMLElement;
  @Prop() name!: string;
  @State() open = false;

  @Listen('click', { target: 'document' })
  handleDocumentClick(event: MouseEvent) {
    if (this.open && !event.composedPath().includes(this.host)) {
      this.open = false;
    }
  }

  @Listen('keydown', { target: 'document' })
  handleDocumentKeydown(event: KeyboardEvent) {
    if (this.open && event.key === 'Escape') {
      this.open = false;
    }
  }

  private toggle = (): void => {
    this.open = !this.open;
  };

  render() {
    return (
      <div class="scds-user-menu">
        <button
          class="scds-user-menu__trigger"
          type="button"
          aria-haspopup="true"
          aria-expanded={this.open ? 'true' : 'false'}
          onClick={this.toggle}
        >
          <span class="scds-user-menu__avatar" aria-hidden="true">
            {initialsFrom(this.name)}
          </span>
          <span class="scds-user-menu__name">{this.name}</span>
          <scds-icon name="chevron-down" size="sm"></scds-icon>
        </button>
        {this.open && (
          <div class="scds-user-menu__panel" role="menu">
            <slot></slot>
          </div>
        )}
      </div>
    );
  }
}
