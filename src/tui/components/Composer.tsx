import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import type { UiStore } from "../store.js";
import { useStoreVersion } from "../use-store.js";
import { COLORS } from "../theme.js";
import type { TextareaRenderable } from "@opentui/core";
import { availableCommands } from "../../commands/index.js";
import { StatusIndicator } from "./StatusIndicator.js";

export type SubmitHandler = (
  input: string,
  tag: "command" | "prompt",
) => void;

export type ComposerProps = {
  store: UiStore;
  model: string;
  agentMode: string;
  onSubmit: SubmitHandler;
  onInterrupt?: () => void;
};

export const Composer = ({ store, model, agentMode, onSubmit, onInterrupt }: ComposerProps) => {
  useStoreVersion(store);
  const textareaRef = useRef<TextareaRenderable>(null);
  const isStreaming = store.streaming;
  const queuedCount = store.queuedCount;
  // Allow typing queued prompts while streaming; only block command palette when busy
  const commandPaletteDisabled = isStreaming;

  const [query, setQuery] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [inputHeight, setInputHeight] = useState(2);
  const dimensions = useTerminalDimensions();

  // Poll textarea content to detect "/" command prefix + auto-resize (2 → 4 lines)
  useEffect(() => {
    const id = setInterval(() => {
      const txt = textareaRef.current?.plainText ?? "";
      if (!commandPaletteDisabled && txt.startsWith("/")) {
        const q = txt.trim().split(/\s+/)[0] ?? "/";
        setQuery((prev) => (prev !== q ? q : prev));
      } else {
        setQuery((prev) => (prev !== null ? null : prev));
      }

      // Estimate wrapped lines to grow 2 → 4
      const availWidth = Math.max(20, dimensions.width - 8);
      const rawLines = txt === "" ? 1 : txt.split("\n").length;
      // Count wrapped visual lines for long segments
      let visualLines = 0;
      for (const seg of txt.split("\n")) {
        if (seg.length === 0) visualLines += 1;
        else visualLines += Math.ceil(seg.length / availWidth);
      }
      // When empty, placeholder occupies 1 line, but we keep min 2
      const needed = Math.max(2, Math.min(4, visualLines || 1));
      // Also ensure at least rawLines clamped
      const clamped = Math.min(4, Math.max(2, Math.max(needed, rawLines)));
      setInputHeight((prev) => (prev !== clamped ? clamped : prev));
    }, 50);
    return () => clearInterval(id);
  }, [commandPaletteDisabled, dimensions.width]);

  const filteredCommands = useMemo(() => {
    if (query === null) return [];
    if (query === "/") return availableCommands;
    return availableCommands.filter((c) => c.name.startsWith(query));
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Arrow navigation when dropdown is open
  useKeyboard(
    useCallback(
      (key) => {
        if (filteredCommands.length === 0 || commandPaletteDisabled) return;
        if (key.name === "up") {
          setSelectedIndex((s) => (s - 1 + filteredCommands.length) % filteredCommands.length);
        } else if (key.name === "down") {
          setSelectedIndex((s) => (s + 1) % filteredCommands.length);
        } else if (key.name === "escape") {
          // Clear the "/" prefix to close dropdown
          if (textareaRef.current?.plainText.startsWith("/")) {
            textareaRef.current?.setText("");
          }
          setQuery(null);
        }
      },
      [filteredCommands, commandPaletteDisabled],
    ),
  );

  // ESC to interrupt while streaming
  useKeyboard(
    useCallback(
      (key) => {
        if (key.name === "escape" && isStreaming) {
          // If dropdown is open, let the dropdown handler close it first.
          // Only interrupt when no dropdown is visible.
          if (filteredCommands.length === 0) {
            onInterrupt?.();
          }
        }
      },
      [isStreaming, filteredCommands.length, onInterrupt],
    ),
  );

  const statusText =
    store.status !== "" ? store.status : store.streaming ? "working…" : "ready";

  const statusColor = store.streaming
    ? COLORS.amber
    : store.status !== ""
      ? COLORS.cyan
      : COLORS.green;

  const submit = useCallback(() => {
    const raw = textareaRef.current?.plainText.trim() ?? "";
    if (raw === "") return;

    // If command palette is open, Enter selects the highlighted command
    if (raw.startsWith("/") && filteredCommands.length > 0) {
      const picked = filteredCommands[selectedIndex];
      if (picked) {
        textareaRef.current?.setText("");
        setQuery(null);
        onSubmit(picked.name, "command");
        return;
      }
    }

    textareaRef.current?.setText("");
    setQuery(null);
    if (raw.startsWith("/")) {
      onSubmit(raw, "command");
    } else {
      onSubmit(raw, "prompt");
    }
  }, [onSubmit, filteredCommands, selectedIndex]);

  const showDropdown = filteredCommands.length > 0 && !commandPaletteDisabled;

  const borderColor = isStreaming ? COLORS.amber : COLORS.border;

  return (
    <box
      width="100%"
      flexDirection="column"
      border
      borderStyle="rounded"
      borderColor={borderColor}
      backgroundColor={COLORS.bg}
      paddingX={1}
      flexShrink={0}
    >
      {showDropdown && (
        <box
          flexDirection="column"
          border
          borderStyle="rounded"
          borderColor={COLORS.border}
          backgroundColor={COLORS.bg}
          marginBottom={1}
          paddingY={1}
        >
          {filteredCommands.map((cmd, idx) => (
            <box
              key={cmd.name}
              flexDirection="row"
              gap={1}
              paddingX={1}
              backgroundColor={idx === selectedIndex ? COLORS.selection : COLORS.transparent}
            >
              <text fg={idx === selectedIndex ? COLORS.green : COLORS.front}>
                {idx === selectedIndex ? "› " : "  "}
                {cmd.name}
              </text>
              <text fg={COLORS.dim}>{cmd.description}</text>
            </box>
          ))}
          <box marginTop={1} paddingX={1}>
            <text fg={COLORS.dim}>↑↓ navigate · ↵ select · esc close</text>
          </box>
        </box>
      )}

      <textarea
        ref={textareaRef}
        onSubmit={submit}
        placeholder={
          isStreaming
            ? `  Working… type to queue next message…`
            : `  Can’t fix your relationship. Let me do the code.`
        }
        width="100%"
        height={inputHeight}
        wrapMode="word"
        focused
        keyBindings={[
          { name: "return", action: "submit" },
          { name: "kpenter", action: "submit" },
          { name: "linefeed", action: "submit" },
          { name: "return", shift: true, action: "newline" },
        ]}
      />

      {isStreaming && queuedCount > 0 && (
        <box width="100%" paddingY={1}>
          <text fg={COLORS.dim}>add messages in between agent will process once this iteration is finished</text>
        </box>
      )}

      <box
        width="100%"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <box flexDirection="row" gap={1} alignItems="center">
          {store.streaming || store.status !== "" ? (
            <StatusIndicator label={statusText} color={statusColor} />
          ) : (
            <text fg={statusColor}>● {statusText}</text>
          )}
          <text fg={COLORS.dim}>· {model || "—"}</text>
          <text fg={COLORS.dim}>·</text>
          <text fg={agentMode === "plan" ? COLORS.amber : COLORS.blue}>{agentMode?.toUpperCase() || "BUILD"}</text>
        </box>
        <text fg={COLORS.dim}>{isStreaming ? "esc to interrupt · ↵ queue" : "type / for commands"}</text>
      </box>
    </box>
  );
};
