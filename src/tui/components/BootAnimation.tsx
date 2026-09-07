import { useCallback, useEffect, useMemo, useState } from "react";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { COLORS } from "../theme.js";

export type BootAnimationProps = {
  onComplete: () => void;
  durationMs?: number;
};

const SPINNER_FRAMES = ["◐", "◓", "◑", "◒"] as const;

const LOGO = [
  "████████╗ █████╗ ██████╗ ███████╗",
  "╚══██╔══╝██╔══██╗██╔══██╗██╔════╝",
  "   ██║   ███████║██████╔╝███████╗",
  "   ██║   ██╔══██║██╔══██╗╚════██║",
  "   ██║   ██║  ██║██║  ██║███████║",
];

const STEPS = [
  "Initializing core systems",
  "Loading neural matrix",
  "Calibrating humor",
  "Linking memory",
  "Establishing uplink",
];

const TOTAL_DURATION = 2600;

export const BootAnimation = ({ onComplete, durationMs = TOTAL_DURATION }: BootAnimationProps) => {
  const [elapsed, setElapsed] = useState(0);
  const [spinner, setSpinner] = useState(0);
  const [blink, setBlink] = useState(true);
  const { width: termWidth } = useTerminalDimensions();

  useKeyboard(
    useCallback(
      (key) => {
        if (key.ctrl && key.name === "c") return;
        if (key.name) onComplete();
      },
      [onComplete],
    ),
  );

  useEffect(() => {
    const start = Date.now();
    const tick = setInterval(() => {
      const now = Date.now();
      const e = now - start;
      setElapsed(e);
      if (e >= durationMs) {
        clearInterval(tick);
        setTimeout(onComplete, 180);
      }
    }, 40);

    const spin = setInterval(() => {
      setSpinner((s) => (s + 1) % SPINNER_FRAMES.length);
    }, 70);

    const blinkIv = setInterval(() => setBlink((b) => !b), 520);

    return () => {
      clearInterval(tick);
      clearInterval(spin);
      clearInterval(blinkIv);
    };
  }, [durationMs, onComplete]);

  const progress = useMemo(() => {
    const t = Math.min(1, elapsed / durationMs);
    const eased = 1 - Math.pow(1 - t, 3);
    return Math.min(100, Math.floor(eased * 100));
  }, [elapsed, durationMs]);

  const activeIndex = useMemo(() => {
    const t = elapsed / durationMs;
    // equally spaced, replacing one after another
    const idx = Math.floor(t * STEPS.length);
    return Math.min(idx, STEPS.length - 1);
  }, [elapsed, durationMs]);

  const logoProgress = Math.min(LOGO.length, Math.max(1, Math.ceil((elapsed / 650) * LOGO.length)));
  const isDone = progress >= 100;

  const barWidth = termWidth < 60 ? 20 : termWidth < 76 ? 28 : 36;
  const filled = Math.round((progress / 100) * barWidth);
  const empty = barWidth - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);

  // Single replacing status
  const status = useMemo(() => {
    if (isDone) return { icon: "✓", label: "Systems online", color: COLORS.green };
    const label = STEPS[activeIndex] ?? STEPS[0]!;
    return { icon: SPINNER_FRAMES[spinner]!, label: `${label}…`, color: COLORS.amber };
  }, [activeIndex, isDone, spinner]);

  return (
    <box
      width="100%"
      height="100%"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      backgroundColor={COLORS.bg}
      padding={1}
    >
      <box
        width={68}
        maxWidth="90%"
        flexDirection="column"
        border
        borderStyle="rounded"
        borderColor={isDone ? COLORS.green : COLORS.border}
        backgroundColor={COLORS.bg}
        paddingX={3}
        paddingY={2}
        gap={1}
        alignItems="center"
      >
        {/* Logo — blue, same block font */}
        <box flexDirection="column" alignItems="center">
          {LOGO.slice(0, logoProgress).map((line, i) => {
            const isLastVisible = i === logoProgress - 1 && logoProgress < LOGO.length;
            return (
              <text key={i} fg={isLastVisible && blink ? COLORS.dim : COLORS.blue}>
                {line}
              </text>
            );
          })}
        </box>

        {/* Single replacing status — what is loading */}
        <box
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
          gap={1}
          marginTop={1}
          width="100%"
        >
          <text fg={status.color}>{status.icon}</text>
          <text fg={status.color === COLORS.green ? COLORS.green : COLORS.front}>{status.label}</text>
          {!isDone && <text fg={COLORS.amber}>{blink ? " █" : "  "}</text>}
        </box>

        {/* Minimal progress */}
        <box flexDirection="column" alignItems="center" gap={0} width="100%" marginTop={1}>
          <text fg={isDone ? COLORS.green : COLORS.blue}>
            [{bar}] {String(progress).padStart(3, " ")}%
          </text>
          <text fg={COLORS.dim}>{isDone ? "ready" : "any key to skip"}</text>
        </box>
      </box>
    </box>
  );
};
