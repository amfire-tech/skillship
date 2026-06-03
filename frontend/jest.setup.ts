/*
 * File:    frontend/jest.setup.ts
 * Purpose: Global test setup — RTL matchers + fetch polyfill.
 * Owner:   Pranav
 */
import "@testing-library/jest-dom";

if (!global.fetch) {
  global.fetch =
    typeof jest !== "undefined"
      ? (jest.fn() as unknown as typeof fetch)
      : ((() => Promise.resolve(new Response())) as unknown as typeof fetch);
}
