import { useEffect, useState } from "react";
import { COLORS } from "../theme.js";

const FRAMES = [
  "◐",
  "◓",
  "◑",
  "◒",
] as const;

export type StatusIndicatorProps = {
  label?: string;
  color?: string;
  intervalMs?: number;
};

export const StatusIndicator = ({
  label = "Thinking...",
  color = COLORS.cyan,
  intervalMs = 60,
}: StatusIndicatorProps) => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % FRAMES.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return <text fg={color}>{FRAMES[frame]} {label}</text>;
};