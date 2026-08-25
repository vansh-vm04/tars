import { useSyncExternalStore } from "react";
import type { UiStore } from "./store.js";

export const useStoreVersion = (store: UiStore): number =>
  useSyncExternalStore(store.subscribe, store.getSnapshot);