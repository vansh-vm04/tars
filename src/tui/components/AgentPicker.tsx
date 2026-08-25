import { useCallback, useMemo } from "react";
import { useKeyboard } from "@opentui/react";
import type { AgentMode } from "../../types.js";
import { COLORS } from "../theme.js";

export type AgentPickerProps = {
  currentMode: AgentMode;
  onPick: (mode: AgentMode) => void;
  onCancel: () => void;
};

const MODES: { id: AgentMode; name: string; description: string }[] = [
  {
    id: "build",
    name: "build",
    description: "Full access — can read, write, edit and run commands",
  },
  {
    id: "plan",
    name: "plan",
    description: "Read-only — inspection and planning, no file edits",
  },
];

export const AgentPicker = ({ currentMode, onPick, onCancel }: AgentPickerProps) => {
  useKeyboard(
    useCallback(
      (key) => {
        if (key.name === "escape") onCancel();
        if (key.name === "c" && key.ctrl) onCancel();
      },
      [onCancel],
    ),
  );

  const options = useMemo(
    () =>
      MODES.map((m) => ({
        name: `${m.name}${m.id === currentMode ? "  ● current" : ""}`,
        description: m.description,
        value: m.id,
      })),
    [currentMode],
  );

  const handleSelect = useCallback(
    (_index: number, option: { value?: unknown } | null) => {
      if (option && option.value) onPick(option.value as AgentMode);
    },
    [onPick],
  );

  return (
    <box
      width="100%"
      height="100%"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      backgroundColor={COLORS.bg}
      padding={2}
    >
      <box
        width="60%"
        flexDirection="column"
        border
        borderStyle="rounded"
        borderColor={COLORS.amber}
        backgroundColor={COLORS.bg}
        paddingX={2}
        paddingY={2}
        gap={1}
      >
        <box flexDirection="row" justifyContent="space-between" alignItems="center">
          <box flexDirection="column">
            <text fg={COLORS.amber}>
              <strong>◆ Select agent mode</strong>
            </text>
            <text fg={COLORS.dim}>current: {currentMode} · 2 modes</text>
          </box>
          <text fg={COLORS.dim}>esc to close</text>
        </box>

        <box width="100%" height={1} flexDirection="row">
          <text fg={COLORS.dim}>{"─".repeat(60)}</text>
        </box>

        <select
          options={options}
          focused
          onSelect={handleSelect}
          showDescription
          width="100%"
          height={6}
        />

        <box
          width="100%"
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          paddingTop={1}
        >
          <text fg={COLORS.dim}>↑↓ navigate</text>
          <text fg={COLORS.amber}>↵ select</text>
        </box>
      </box>
    </box>
  );
};
