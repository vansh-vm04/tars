import type { ViewMessage } from "../../store.js";
import { useStoreVersion } from "./use-store.js";
import { COLORS } from "./theme.js";

const splitLines = (text: string): string[] =>
  text === "" ? [""] : text.split("\n");

type MessageProps = { message: ViewMessage };

const ThinkingBlock = ({ text }: { text: string }) => (
  <box flexDirection="column">
    {splitLines(text).map((line, i) => (
      <text key={i} fg={COLORS.dim}>
        ⟳ {line}
      </text>
    ))}
  </box>
);

const MessageText = ({ text }: { text: string }) => (
  <box flexDirection="column">
    {splitLines(text).map((line, i) => (
      <text key={i} wrapMode="word" width="100%">
        {line}
      </text>
    ))}
  </box>
);

const ToolCallRow = ({ tool }: { tool: ViewMessage["toolCalls"][number] }) => (
  <box flexDirection="row">
    <text fg={tool.status === "running" ? COLORS.amber : COLORS.green}>
      {tool.status === "running" ? "⟳" : "✓"}{" "}
    </text>
    <text fg={tool.status === "running" ? COLORS.amber : COLORS.green}>
      {tool.label}
    </text>
  </box>
);

const Message = ({ message }: MessageProps) => {
  if (message.role === "user") {
    return (
      <box flexDirection="column" marginY={1}>
        <text fg={COLORS.blue}>
          {"> "}
          <strong>{message.text}</strong>
        </text>
      </box>
    );
  }

  if (message.role === "error") {
    return (
      <box flexDirection="column" marginY={1}>
        <text fg={COLORS.red}>error: {message.text}</text>
      </box>
    );
  }

  if (message.role === "system") {
    return (
      <box flexDirection="column" marginY={1}>
        <text fg={COLORS.cyan}>i {message.text}</text>
      </box>
    );
  }

  return (
    <box flexDirection="column" marginY={1}>
      {(message.thinkingOpen || message.thinking !== "") && (
        <ThinkingBlock text={message.thinking} />
      )}
      {message.toolCalls.map((tool) => (
        <ToolCallRow key={tool.id} tool={tool} />
      ))}
      {message.text !== "" && <MessageText text={message.text} />}
      {!message.finished && message.text === "" && (
        <text fg={COLORS.dim}>…</text>
      )}
    </box>
  );
};

export type MessageListProps = { store: import("../../store.js").UiStore };

export const MessageList = ({ store }: MessageListProps) => {
  useStoreVersion(store);
  return (
    <scrollbox
      stickyScroll
      stickyStart="bottom"
      width="100%"
      flexGrow={1}
      marginX={1}
    >
      {store.messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
    </scrollbox>
  );
};