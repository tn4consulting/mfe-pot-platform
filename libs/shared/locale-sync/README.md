# shared-locale-sync

Cross-remote active-locale sync (`localStorage` + `CustomEvent` broadcast), framework-agnostic. Extracted out of `shared-i18n` so a non-Angular remote (e.g. a React remote) can consume it without resolving `@angular/core`/`@jsverse/transloco` through that package's barrel export.

## Running unit tests

Run `nx test shared-locale-sync` to execute the unit tests.
