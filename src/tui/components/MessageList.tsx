import type { ViewMessage } from "../types.js";
import { useStoreVersion } from "../use-store.js";
import { COLORS } from "../theme.js";
import { markdownSyntaxStyle, thinkingMarkdownSyntaxStyle } from "../theme.js";

type MessageProps = {
  message: ViewMessage;
};

const ThinkingBlock = ({ text }: { text: string }) => (
  <box flexDirection="column" marginY={1}>
    <text fg={COLORS.cyan}>
      ◌ Thinking...
    </text>
    <markdown
      content={text}
      syntaxStyle={thinkingMarkdownSyntaxStyle}
      streaming
    />
  </box>
);

const ToolCallRow = ({ tool }: { tool: ViewMessage["toolCalls"][number] }) => (
  <box flexDirection="row" marginY={1}>
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
        <text fg={COLORS.red}>{"⚠ " + message.text}</text>
      </box>
    );
  }

  if (message.role === "system") {
    return (
      <box flexDirection="column" marginY={1}>
        <text fg={COLORS.yellow}>{message.text}</text>
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

      {message.text !== "" && (
        <box marginY={1}>
        <markdown
          content={message.text}
          streaming={!message.finished}
          syntaxStyle={markdownSyntaxStyle}
        />
        </box>
      )}

      {!message.finished && message.text === "" && (
        <text fg={COLORS.dim} marginY={1}>…</text>
      )}
    </box>
  );
};

export type MessageListProps = {
  store: import("../store.js").UiStore;
};

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