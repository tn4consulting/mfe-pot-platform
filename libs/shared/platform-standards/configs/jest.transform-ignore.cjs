// The `transformIgnorePatterns` entry every app repo's jest.config.cts was
// independently re-deriving -- a faithful extraction of the existing
// pattern, not a new one. Needed because published @tn4consulting/shared-*
// packages (and @softarc/@jsverse/@stencil) are ESM with no
// "type": "module" in their own package.json, so Jest's default CJS
// require() can't parse them once resolved through a real node_modules --
// see mfe-pot-platform/CLAUDE.md's "Strong contracts between split repos"
// section. Usage in a repo's own jest.config.cts:
//
//   const transformIgnorePatterns = require('@tn4consulting/shared-platform-standards/configs/jest.transform-ignore.cjs');
//   module.exports = { ...., transformIgnorePatterns };
module.exports = ['node_modules/(?!\\.pnpm|(@softarc|@jsverse|@tn4consulting|@stencil)/|.*\\.mjs$)'];
