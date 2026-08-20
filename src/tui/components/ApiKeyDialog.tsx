import { useCallback, useState } from "react";
import { useKeyboard } from "@opentui/react";
import { COLORS } from "./theme.js";

export type ApiKeyDialogProps = {
  onSubmit: (apiKey: string) => void;
  onCancel: () => void;
};

export const ApiKeyDialog = ({ onSubmit, onCancel }: ApiKeyDialogProps) => {
  const [apiKey, setApiKey] = useState("");

  useKeyboard(
    useCallback(
      (key) => {
        if (key.name === "escape") onCancel();
        if (key.name === "c" && key.ctrl) onCancel();
      },
      [onCancel],
    ),
  );

  const submit = useCallback(
    (value: unknown) => {
      const key = typeof value === "string" ? value.trim() : "";
      if (key !== "") onSubmit(key);
    },
    [onSubmit],
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
        <strong>Gemini API key required</strong>
      </text>
      <text fg={COLORS.front}>Paste your Google API key below.</text>
      <text fg={COLORS.dim}>
        It is stored in {process.env.APPDATA ?? "~"}\tars\auth.json
      </text>
      <input
        value={apiKey}
        onInput={setApiKey}
        onSubmit={submit}
        placeholder="AIza…"
        focused
        width="100%"
      />
    </box>
  );
};