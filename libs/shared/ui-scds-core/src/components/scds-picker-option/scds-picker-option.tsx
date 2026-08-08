import { Component, Prop, Element } from '@stencil/core';

/**
 * A single option for `scds-picker` -- composition mirrors
 * `scds-breadcrumbs`/`scds-breadcrumbs-item` (light-DOM child elements
 * carrying plain, serializable data), not a JSON-string/imperative-property
 * prop on the parent the way `scds-multi-column-list`'s `columns` has to be
 * (that component's columns embed non-serializable render functions --
 * these options don't). Meaningless outside a `scds-picker` parent, same
 * spirit as `scds-breadcrumbs-item`.
 *
 * `scds-picker` is `shadow: true` with no `<slot>` in its own template, so
 * these children are never actually rendered/projected by the browser --
 * `scds-picker` reads `value`/textContent directly off its own light-DOM
 * children instead, once, in `componentWillLoad` (see its own comment on
 * why a one-time read is enough here). Deliberately has **no `render()`
 * method at all** -- not even one returning `null` -- so Stencil never
 * touches this host's children: a `render()` that overwrote them (even
 * with nothing) would race `scds-picker`'s own read of this element's
 * `textContent`, and could clear the label text before the parent ever
 * sees it. `display: none` is set directly via the DOM API instead of a
 * `styleUrl`, for the same reason -- no shadow root, no scoped stylesheet.
 */
@Component({
  tag: 'scds-picker-option',
})
export class ScdsPickerOption {
  @Element() el!: HTMLElement;
  @Prop() value!: string;

  connectedCallback(): void {
    this.el.style.display = 'none';
  }
}
