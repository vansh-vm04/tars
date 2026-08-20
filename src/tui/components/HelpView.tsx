import { useCallback } from "react";
import { useKeyboard } from "@opentui/react";
import { availableCommands } from "../../commands/index.js";
import { COLORS } from "./theme.js";

export type HelpViewProps = { onClose: () => void };

export const HelpView = ({ onClose }: HelpViewProps) => {
  useKeyboard(
    useCallback(
      (key) => {
        if (key.name === "escape") onClose();
        if (key.name === "c" && key.ctrl) onClose();
        if (key.name === "q") onClose();
      },
      [onClose],
    ),
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
        <strong>TARS commands</strong>
      </text>
      {availableCommands.map((command) => (
        <box key={command.name} flexDirection="row">
          <text fg={COLORS.blue}>
            <strong>{command.name}</strong>
          </text>
          <text fg={COLORS.front}>
            {"  "}
            {command.description}
          </text>
        </box>
      ))}
      <text fg={COLORS.dim}>press esc to close</text>
    </box>
  );
};