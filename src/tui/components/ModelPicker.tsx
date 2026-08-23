import { useCallback, useMemo } from "react";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import type { ModelDefinition } from "../../types.js";
import { COLORS } from "./theme.js";

export type ModelPickerProps = {
  models: ModelDefinition[];
  onPick: (model: ModelDefinition) => void;
  onCancel: () => void;
};

export const ModelPicker = ({ models, onPick, onCancel }: ModelPickerProps) => {
  const { height: termHeight } = useTerminalDimensions();

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
      models.map((model) => ({
        name: model.name,
        description: `${model.id}`,
        value: model,
      })),
    [models],
  );

  const handleSelect = useCallback(
    (_index: number, option: { value?: unknown } | null) => {
      if (option && option.value) onPick(option.value as ModelDefinition);
    },
    [onPick],
  );

  // Show at least 5 items, scale with terminal height (each item = 2 rows with description)
  const visibleCount = Math.max(5, Math.min(options.length, Math.floor((termHeight - 14) / 2)));
  const selectHeight = Math.max(8, Math.min(options.length * 2, visibleCount * 2));

  if (models.length === 0) {
    return (
      <box
        width="100%"
        height="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        backgroundColor={COLORS.bg}
        padding={4}
      >
        <box
          width="60%"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          border
          borderStyle="rounded"
          borderColor={COLORS.border}
          backgroundColor={COLORS.bg}
          paddingX={4}
          paddingY={3}
          gap={1}
        >
          <text fg={COLORS.amber}>◈ No models available</text>
          <text fg={COLORS.dim}>Check your connection or try again.</text>
          <box marginTop={1}>
            <text fg={COLORS.dim}>esc to close</text>
          </box>
        </box>
      </box>
    );
  }

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
        width="70%"
        flexDirection="column"
        border
        borderStyle="rounded"
        borderColor={COLORS.blue}
        backgroundColor={COLORS.bg}
        paddingX={2}
        paddingY={2}
        gap={1}
      >
        <box flexDirection="row" justifyContent="space-between" alignItems="center">
          <box flexDirection="column">
            <text fg={COLORS.green}>
              <strong>◆ Select a model</strong>
            </text>
            <text fg={COLORS.dim}>
              {models.length} model{models.length !== 1 ? "s" : ""}
            </text>
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
          showScrollIndicator={options.length > visibleCount}
          width="100%"
          height={selectHeight}
        />

        <box
          width="100%"
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          paddingTop={1}
        >
          <text fg={COLORS.dim}>↑↓ navigate · {visibleCount} visible</text>
          <text fg={COLORS.cyan}>↵ select</text>
        </box>
      </box>
    </box>
  );
};
