/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@tn4consulting/shared-ui-scds-core/dist/components';

import { defineCustomElement as defineScdsCard } from '@tn4consulting/shared-ui-scds-core/dist/components/scds-card.js';
import { defineCustomElement as defineScdsMultiColumnList } from '@tn4consulting/shared-ui-scds-core/dist/components/scds-multi-column-list.js';
@ProxyCmp({
  defineCustomElementFn: defineScdsCard,
  inputs: ['cardTitle', 'cardTitleTag', 'description', 'href', 'imgAlt', 'imgSrc', 'rel', 'target', 'tone', 'toneLabel']
})
@Component({
  selector: 'scds-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: [{ name: 'cardTitle', required: true }, 'cardTitleTag', 'description', 'href', 'imgAlt', 'imgSrc', 'rel', 'target', 'tone', 'toneLabel'],
  outputs: ['scdsClick'],
})
export class ScdsCard {
  protected el: HTMLScdsCardElement;
  @Output() scdsClick = new EventEmitter<ScdsCardCustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { ScdsCardCustomEvent } from '@tn4consulting/shared-ui-scds-core/dist/components';

export declare interface ScdsCard extends Components.ScdsCard {
  /**
   * Re-emits `gcds-card`'s own `gcdsClick` (fired only in link mode).
   */
  scdsClick: EventEmitter<ScdsCardCustomEvent<string>>;
}


@ProxyCmp({
  defineCustomElementFn: defineScdsMultiColumnList,
  inputs: ['columns', 'emptyLabel', 'items', 'listLabel', 'trackBy']
})
@Component({
  selector: 'scds-multi-column-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['columns', 'emptyLabel', 'items', 'listLabel', 'trackBy'],
})
export class ScdsMultiColumnList {
  protected el: HTMLScdsMultiColumnListElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface ScdsMultiColumnList extends Components.ScdsMultiColumnList {}


