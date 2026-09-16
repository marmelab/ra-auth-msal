// jsdom does not expose a few Web APIs that react-admin (through react-router) expects.
import { TextDecoder, TextEncoder } from "node:util";

Object.assign(globalThis, {
  TextEncoder: globalThis.TextEncoder ?? TextEncoder,
  TextDecoder: globalThis.TextDecoder ?? TextDecoder,
});
