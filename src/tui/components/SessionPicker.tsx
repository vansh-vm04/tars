import { useCallback, useMemo } from "react";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import type { Session } from "../../types.js";
import { COLORS } from "../theme.js";

export type SessionPickerProps = {
  sessions: Session[];
  onPick: (session: Session) => void;
  onCancel: () => void;
};

const formatRelative = (ts: number): string => {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
};

export const SessionPicker = ({ sessions, onPick, onCancel }: SessionPickerProps) => {
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
      sessions.map((session) => ({
        name: session.name,
        description: `${formatRelative(session.createdAt)} · ${session.model} · ${session.cwd}`,
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

  // At least 5 visible, scale with terminal height (2 rows per item with description)
  const visibleCount = Math.max(5, Math.min(options.length, Math.floor((termHeight - 14) / 2)));
  const selectHeight = Math.max(10, Math.min(options.length * 2, visibleCount * 2));

  if (sessions.length === 0) {
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
          <text fg={COLORS.amber}>◈ No sessions</text>
          <text fg={COLORS.dim}>No sessions found for this directory.</text>
          <text fg={COLORS.dim}>Start chatting to create one.</text>
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
        width="75%"
        flexDirection="column"
        border
        borderStyle="rounded"
        borderColor={COLORS.border}
        backgroundColor={COLORS.bg}
        paddingX={2}
        paddingY={2}
        gap={1}
      >
        <box flexDirection="row" justifyContent="space-between" alignItems="center">
          <box flexDirection="column">
            <text fg={COLORS.green}>
              <strong>◈ Sessions</strong>
            </text>
            <text fg={COLORS.dim}>
              {sessions.length} session{sessions.length !== 1 ? "s" : ""} · {sessions[0] ? formatRelative(sessions[0].createdAt) + " latest" : ""}
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
          <text fg={COLORS.cyan}>↵ restore</text>
        </box>
      </box>
    </box>
  );
};
