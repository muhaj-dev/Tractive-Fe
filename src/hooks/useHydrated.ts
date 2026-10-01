import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * false in the server HTML and during hydration, true once React has taken
 * over in the browser. Password forms keep their submit disabled until then,
 * so a submit before the JS loads can't send credentials as a native form post.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
