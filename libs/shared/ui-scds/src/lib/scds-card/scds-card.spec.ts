import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScdsCard } from './scds-card';

@Component({
  standalone: true,
  imports: [ScdsCard],
  template: `
    <scds-card
      [cardTitle]="cardTitle"
      [href]="href"
      [tone]="tone"
      [toneLabel]="toneLabel"
      (cardClick)="clicked = $event"
    >
      <p class="body">Body content</p>
      <div scdsCardActions><button type="button" class="action">Action</button></div>
    </scds-card>
  `,
})
class HostComponent {
  cardTitle = 'Test card';
  href?: string;
  tone?: 'info' | 'success' | 'warning' | 'danger';
  toneLabel?: string;
  clicked?: string;
}

describe('ScdsCard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
  });

  it('renders a real gcds-card in link mode', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.href = '/somewhere';
    fixture.detectChanges();

    const gcdsCard = fixture.nativeElement.querySelector('gcds-card');
    expect(gcdsCard).toBeTruthy();
    expect(gcdsCard.getAttribute('cardTitle') ?? gcdsCard.cardTitle).toBe('Test card');
  });

  it('renders its own non-empty markup in static mode (no href)', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('gcds-card')).toBeFalsy();
    const staticCard = fixture.nativeElement.querySelector('.scds-card--static');
    expect(staticCard).toBeTruthy();
    expect(staticCard.textContent).toContain('Test card');
  });

  it('renders a tone badge with the tone label when tone is set', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.tone = 'warning';
    fixture.componentInstance.toneLabel = 'Warning';
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.scds-card__badge--warning');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('Warning');
  });

  it('renders no badge when tone is not set', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.scds-card__badge')).toBeFalsy();
  });

  it('projects scdsCardActions content in static mode', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.scds-card__actions .action')).toBeTruthy();
  });

  it('projects scdsCardActions content in link mode', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.href = '/somewhere';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.scds-card__actions .action')).toBeTruthy();
  });

  it('emits cardClick when gcds-card emits gcdsClick', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.href = '/somewhere';
    fixture.detectChanges();

    const gcdsCard = fixture.nativeElement.querySelector('gcds-card');
    gcdsCard.dispatchEvent(new CustomEvent('gcdsClick', { detail: '/somewhere' }));

    expect(fixture.componentInstance.clicked).toBeTruthy();
  });
});
