import { useCallback, useMemo } from "react";
import { useKeyboard } from "@opentui/react";
import type { ModelDefinition } from "../../types.js";
import { COLORS } from "./theme.js";

export type ModelPickerProps = {
  models: ModelDefinition[];
  onPick: (model: ModelDefinition) => void;
  onCancel: () => void;
};

export const ModelPicker = ({ models, onPick, onCancel }: ModelPickerProps) => {
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
        description: model.id,
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

  return (
    <box
      width="100%"
      height="100%"
      flexDirection="column"
      paddingX={4}
      paddingY={4}
      backgroundColor={COLORS.bg}
    >
      <text fg={COLORS.green}>
        <strong>Select a model</strong>
      </text>
      <text fg={COLORS.dim}>↑/↓ move · enter to select · esc to cancel</text>
      <select
        options={options}
        focused
        onSelect={handleSelect}
        showDescription
        width="100%"
        height="100%"
      />
    </box>
  );
};