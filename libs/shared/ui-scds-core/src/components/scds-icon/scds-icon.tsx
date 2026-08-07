import { Component, Prop, Watch, h } from '@stencil/core';
import { SCDS_ICON_PATHS, ScdsIconName } from './scds-icon-paths';

/**
 * Replaces gcds-icon -- GCDS's own icon font/sprite goes away with the
 * package, so this renders a fixed set of inline SVGs (original path data,
 * not vendored) using stroke="currentColor" so it inherits color from CSS
 * context (nav links, badges, buttons).
 */
@Component({
  tag: 'scds-icon',
  styleUrl: 'scds-icon.css',
  shadow: true,
})
export class ScdsIcon {
  @Prop() name!: ScdsIconName;
  @Prop() size: 'sm' | 'md' | 'lg' = 'md';
  /** Accessible name. Omitted (the default) renders the icon aria-hidden -- use only when the icon is purely decorative alongside visible text. */
  @Prop() label?: string;

  // Stencil's SVGAttributes JSX typing has no `innerHTML` (unlike its
  // HTMLAttributes), even though the DOM property is real on any SVG
  // element -- set it imperatively via a ref instead of fighting the type.
  // The ref callback only fires on mount/unmount, not every re-render, so
  // @Watch covers the case of `name` changing on an already-mounted
  // instance.
  private svgEl?: SVGElement;

  private setPathMarkup = (el: SVGElement | undefined): void => {
    this.svgEl = el;
    if (el) {
      el.innerHTML = SCDS_ICON_PATHS[this.name] ?? '';
    }
  };

  @Watch('name')
  onNameChange(): void {
    if (this.svgEl) {
      this.svgEl.innerHTML = SCDS_ICON_PATHS[this.name] ?? '';
    }
  }

  render() {
    if (!SCDS_ICON_PATHS[this.name]) {
      return null;
    }
    return (
      <svg
        ref={this.setPathMarkup}
        class={`scds-icon scds-icon--${this.size}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        role={this.label ? 'img' : undefined}
        aria-hidden={this.label ? undefined : 'true'}
        aria-label={this.label}
      ></svg>
    );
  }
}
