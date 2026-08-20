import { useCallback, useMemo } from "react";
import { useKeyboard } from "@opentui/react";
import type { Session } from "../../types.js";
import { COLORS } from "./theme.js";

export type SessionPickerProps = {
  sessions: Session[];
  onPick: (session: Session) => void;
  onCancel: () => void;
};

export const SessionPicker = ({ sessions, onPick, onCancel }: SessionPickerProps) => {
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
      sessions.map((session) => ({
        name: session.name,
        description: new Date(session.createdAt).toLocaleString(),
        value: session,
      })),
    [sessions],
  );

  const handleSelect = useCallback(
    (_index: number, option: { value?: unknown } | null) => {
      if (option && option.value) onPick(option.value as Session);
    },
    [onPick],
  );

  if (sessions.length === 0) {
    return (
      <box
        width="100%"
        height="100%"
        flexDirection="column"
        paddingX={4}
        paddingY={4}
        backgroundColor={COLORS.bg}
      >
        <text fg={COLORS.yellow}>No sessions found for the current directory.</text>
      </box>
    );
  }

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
        <strong>Select a session</strong>
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