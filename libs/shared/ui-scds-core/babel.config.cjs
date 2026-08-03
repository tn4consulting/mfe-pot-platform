// Plain babel-jest config, deliberately independent of jest-preset-angular
// (used by the other libs/shared/* packages) -- this is a framework-agnostic
// Stencil package, and its tests exercise the *built* dist-custom-elements
// output (real ESM, `export{...}from"..."`), which needs transpiling to
// CommonJS for Jest same as the spec files' own TypeScript syntax.
module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/preset-typescript'],
};
