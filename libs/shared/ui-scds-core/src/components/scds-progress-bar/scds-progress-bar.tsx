import { Component, Prop, h } from '@stencil/core';

/**
 * Step-progress indicator for a multi-step flow (first consumer: the EI
 * application wizard in mfe-pot-employment-insurance-mfe). Deliberately a
 * plain proportional bar + text, not a full stepper-with-dots component --
 * the name is "progress-bar", and no consumer today needs a per-step dot
 * list.
 */
@Component({
  tag: 'scds-progress-bar',
  styleUrl: 'scds-progress-bar.css',
  shadow: true,
})
export class ScdsProgressBar {
  @Prop() current!: number;
  @Prop() total!: number;
  @Prop() stepLabel?: string;

  private percentComplete(): number {
    if (this.total <= 0) {
      return 0;
    }
    return Math.min(100, Math.max(0, (this.current / this.total) * 100));
  }

  private valueText(): string {
    return this.stepLabel
      ? `Step ${this.current} of ${this.total}: ${this.stepLabel}`
      : `Step ${this.current} of ${this.total}`;
  }

  render() {
    return (
      <div
        class="scds-progress-bar"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={this.total}
        aria-valuenow={this.current}
        aria-valuetext={this.valueText()}
      >
        <div class="scds-progress-bar__track">
          <div class="scds-progress-bar__fill" style={{ width: `${this.percentComplete()}%` }}></div>
        </div>
        <p class="scds-progress-bar__text">
          <span class="scds-progress-bar__step-count">
            Step {this.current} of {this.total}
          </span>
          {this.stepLabel ? <span class="scds-progress-bar__step-label">{this.stepLabel}</span> : null}
        </p>
      </div>
    );
  }
}
