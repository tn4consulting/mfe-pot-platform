import { Component, Prop, h } from '@stencil/core';

/** Replaces gcds-breadcrumbs-item. A "/" separator renders before every item except the first -- determined via :host(:first-child) in the light DOM, see scds-breadcrumbs-item.css. */
@Component({
  tag: 'scds-breadcrumbs-item',
  styleUrl: 'scds-breadcrumbs-item.css',
  shadow: true,
})
export class ScdsBreadcrumbsItem {
  @Prop() href?: string;

  render() {
    return (
      <li class="scds-breadcrumbs-item">
        <span class="scds-breadcrumbs-item__separator" aria-hidden="true">
          /
        </span>
        {this.href ? (
          <a href={this.href}>
            <slot></slot>
          </a>
        ) : (
          <span aria-current="page">
            <slot></slot>
          </span>
        )}
      </li>
    );
  }
}
