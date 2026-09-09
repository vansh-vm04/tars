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

const ToolDiff = ({ tool }: { tool: ViewMessage["toolCalls"][number] }) => {
  const diff = tool.diff;
  if (!diff) return null;
  const isBash = tool.name === "bash";
  const isEdit = tool.name === "edit";
  const isWrite = tool.name === "write";
  if (!isBash && !isEdit && !isWrite) return null;

  // Grayed code-like box — single boxed command for bash, no duplicate header
  return (
    <box flexDirection="column" marginTop={1} gap={0} width="100%" paddingLeft={1}>
      {!isBash && (
        <box flexDirection="row" gap={1} alignItems="center" marginBottom={1}>
          <text fg={COLORS.dim}>·</text>
          <text fg={COLORS.cyan}>{diff.path}</text>
          <text fg={COLORS.dim}>{isEdit ? "edit" : "write"}</text>
        </box>
      )}

      <box
        flexDirection="column"
        backgroundColor={COLORS.selection}
        paddingX={1}
        paddingY={1}
        gap={0}
        width="100%"
      >
        {!isBash ? (
          <>
            {diff.oldLines.slice(0, 6).map((line, i) => (
              <text key={`o-${i}`} fg={COLORS.red}>
                {"- " + (line.length > 86 ? line.slice(0, 86) + "…" : line || " ")}
              </text>
            ))}
            {diff.newLines.slice(0, 6).map((line, i) => (
              <text key={`n-${i}`} fg={COLORS.green}>
                {"+ " + (line.length > 86 ? line.slice(0, 86) + "…" : line || " ")}
              </text>
            ))}
            {(diff.oldLines.length > 6 || diff.newLines.length > 6) && (
              <text fg={COLORS.dim}>… {diff.oldLines.length + diff.newLines.length - 12 > 0 ? `+${diff.oldLines.length + diff.newLines.length - 12} more` : "truncated"}</text>
            )}
          </>
        ) : (
          <>
            {diff.newLines.slice(0, 5).map((line, i) => (
              <text key={`b-${i}`} fg={i === 0 ? COLORS.cyan : COLORS.dim}>
                {i === 0 ? "$ " + line : line.length > 86 ? line.slice(0, 86) + "…" : line}
              </text>
            ))}
            {diff.newLines.length > 5 && <text fg={COLORS.dim}>… +{diff.newLines.length - 5} more</text>}
          </>
        )}
      </box>
    </box>
  );
};

const ToolCallRow = ({ tool }: { tool: ViewMessage["toolCalls"][number] }) => (
  <box flexDirection="column" gap={0} width="100%" marginY={1}>
    <box flexDirection="row" gap={1} alignItems="center">
      {tool.status === "running" ? (
        <StatusIndicator label="" color={COLORS.amber} />
      ) : (
        <text fg={COLORS.green}>✓ </text>
      )}
      <text fg={tool.status === "running" ? COLORS.amber : COLORS.green}>
        {tool.diff ? tool.name : tool.label}
      </text>
    </box>
    <ToolDiff tool={tool} />
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