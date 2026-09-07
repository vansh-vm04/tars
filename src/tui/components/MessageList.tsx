import type { ViewMessage } from "../types.js";
import { useStoreVersion } from "../use-store.js";
import { COLORS } from "../theme.js";
import { markdownSyntaxStyle, thinkingMarkdownSyntaxStyle } from "../theme.js";
import { StatusIndicator } from "./StatusIndicator.js";
import { Welcome } from "./Welcome.js";

type MessageProps = {
  message: ViewMessage;
};

const ThinkingBlock = ({
  text,
  isSpinning,
}: {
  text: string;
  isSpinning: boolean;
}) => (
  <box flexDirection="column" marginY={1}>
    {isSpinning ? (
      <StatusIndicator label="Thinking..." color={COLORS.cyan} />
    ) : (
      <text fg={COLORS.cyan}>○ Thought</text>
    )}
    <markdown
      content={text}
      syntaxStyle={thinkingMarkdownSyntaxStyle}
      streaming={isSpinning}
    />
  </box>
);

const ToolCallRow = ({ tool }: { tool: ViewMessage["toolCalls"][number] }) => (
  <box flexDirection="row" gap={1}>
    {tool.status === "running" ? (
      <StatusIndicator label="" color={COLORS.amber} />
    ) : (
      <text fg={COLORS.green}>✓ </text>
    )}
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
        <ThinkingBlock text={message.thinking} isSpinning={message.thinkingOpen} />
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
        <box marginY={1}>
          <StatusIndicator label="" color={COLORS.amber} />
        </box>
      )}
    </box>
  );
};

export type MessageListProps = {
  store: import("../store.js").UiStore;
  model?: string | undefined;
};

export const MessageList = ({ store, model }: MessageListProps) => {
  useStoreVersion(store);

  // Show welcoming placeholder until first user prompt — then chat takes over
  if (store.messages.length === 0) {
    return (
      <box width="100%" flexGrow={1} flexDirection="column" overflow="hidden">
        <scrollbox width="100%" flexGrow={1}>
          <Welcome model={model} />
        </scrollbox>
      </box>
    );
  }

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