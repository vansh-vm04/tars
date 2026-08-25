import { useTerminalDimensions } from "@opentui/react";
import type { UiStore } from "../store.js";
import { useStoreVersion } from "../use-store.js";
import { COLORS } from "../theme.js";

export type StatusBarProps = {
  store: UiStore;
  model: string;
};

export const StatusBar = ({ store, model }: StatusBarProps) => {
  useStoreVersion(store);
  const dimensions = useTerminalDimensions();
  const status =
    store.status !== ""
      ? store.status
      : store.streaming
        ? "working…"
        : "ready";
  const color = store.streaming ? COLORS.amber : COLORS.green;

  return (
    <box width="100%" paddingX={1} flexDirection="row">
      <text fg={color}>
        {store.streaming ? "⟳" : "●"} {status}
      </text>
      <text fg={COLORS.dim}>
        {"  "}model: {model || "—"}
      </text>
      <text fg={COLORS.dim}>
        {"  "}
        {dimensions.width}×{dimensions.height}
      </text>
    </box>
  );
};