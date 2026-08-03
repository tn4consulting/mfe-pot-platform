/**
 * Stencil's `componentOnReady()` isn't implemented for elements created via
 * the `dist-custom-elements` output target (confirmed empirically -- it's
 * only present on the lazy-loading `dist` output target's runtime). A
 * macrotask tick is enough for the *initial* shadow DOM render after
 * `appendChild`, but a re-render triggered by a later `@Prop()` mutation
 * needs longer (confirmed empirically: a 0ms `setTimeout` reliably missed
 * it, 100ms reliably caught it -- likely Stencil's update scheduling using
 * a rAF-polyfill queue in jsdom that isn't a plain microtask). 20ms is
 * comfortably above the observed flake point without slowing the suite
 * down noticeably.
 */
export function waitForRender(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 20));
}
