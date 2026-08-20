import { useCallback, useState } from "react";
import type { UiStore } from "../../store.js";
import { useStoreVersion } from "./use-store.js";

export type SubmitHandler = (
  input: string,
  tag: "command" | "prompt",
) => void;

export type ComposerProps = {
  store: UiStore;
  onSubmit: SubmitHandler;
};

export const Composer = ({ store, onSubmit }: ComposerProps) => {
  useStoreVersion(store);
  const [draft, setDraft] = useState("");
  const disabled = store.streaming;

  const submit = useCallback(
    (value: unknown) => {
      const text = typeof value === "string" ? value.trim() : "";
      if (text === "") return;
      setDraft("");
      if (text.startsWith("/")) {
        onSubmit(text, "command");
      } else {
        onSubmit(text, "prompt");
      }
    },
    [onSubmit],
  );

  return (
    <box width="100%" paddingX={1} paddingY={1}>
      <input
        value={draft}
        onInput={setDraft}
        onSubmit={submit}
        placeholder="Message TARS…  ( /help, /model, /new, /exit )"
        width="100%"
        focused={!disabled}
      />
    </box>
  );
};