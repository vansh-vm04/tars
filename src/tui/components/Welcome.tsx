import { useEffect, useState } from "react";
import { COLORS } from "../theme.js";

const MINI_LOGO = [
  " ████████╗ █████╗ ██████╗ ███████╗ ",
  " ╚══██╔══╝██╔══██╗██╔══██╗██╔════╝ ",
  "    ██║   ███████║██████╔╝███████╗ ",
  "    ██║   ██╔══██║██╔══██╗╚════██║ ",
  "    ██║   ██║  ██║██║  ██║███████║ ",
];

export type WelcomeProps = {
  model?: string | undefined;
};

export const Welcome = ({ model }: WelcomeProps) => {
  const [frame, setFrame] = useState(0);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % 4), 120);
    const b = setInterval(() => setBlink((v) => !v), 530);
    return () => {
      clearInterval(id);
      clearInterval(b);
    };
  }, []);

  const spinner = ["◐", "◓", "◑", "◒"][frame]!;

  return (
    <box
      width="100%"
      flexGrow={1}
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={1}
      paddingY={2}
    >
      {/* TARS — ASCII block font, blue to match theme */}
      <box flexDirection="column" alignItems="center">
        {MINI_LOGO.map((line) => (
          <text key={line} fg={COLORS.blue}>
            {line}
          </text>
        ))}
      </box>

      {/* Model + humor meta */}
      <box flexDirection="row" gap={2} alignItems="center">
        <text fg={COLORS.green}>{spinner} ready</text>
        <text fg={COLORS.dim}>·</text>
        <text fg={COLORS.dim}>{model || "select a model with /model"}</text>
        <text fg={COLORS.dim}>·</text>
        <text fg={COLORS.amber}>humor 75%</text>
      </box>

      {/* Subtitle — minimal */}
      <box flexDirection="row" gap={1} alignItems="center" marginTop={1}>
        <text fg={COLORS.front}>How can I help you today</text>
        <text fg={COLORS.dim}>{blink ? "█" : " "}</text>
      </box>
    </box>
  );
};
