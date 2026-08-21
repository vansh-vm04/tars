import type { ViewMessage } from "../../store.js";
import { useStoreVersion } from "./use-store.js";
import { COLORS } from "./theme.js";
import { SyntaxStyle, RGBA } from "@opentui/core";

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
  store: import("../../store.js").UiStore;
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

const markdownSyntaxStyle = SyntaxStyle.fromStyles({
  // Normal text
  default: {
    fg: RGBA.fromHex("#C4CDD6"),
  },

  // Headings
  "markup.heading": {
    fg: RGBA.fromHex("#72C7E8"),
    bold: true,
  },

  "markup.heading.1": {
    fg: RGBA.fromHex("#7DD3F0"),
    bold: true,
  },

  "markup.heading.2": {
    fg: RGBA.fromHex("#72C7E8"),
    bold: true,
  },

  "markup.heading.3": {
    fg: RGBA.fromHex("#86BDD2"),
    bold: true,
  },

  // Bold / strong
  "markup.bold": {
    fg: RGBA.fromHex("#E1E7EC"),
    bold: true,
  },

  "markup.strong": {
    fg: RGBA.fromHex("#E1E7EC"),
    bold: true,
  },

  // Italic
  "markup.italic": {
    fg: RGBA.fromHex("#C7BDE2"),
    italic: true,
  },

  // Lists
  "markup.list": {
    fg: RGBA.fromHex("#72B7D6"),
  },

  "markup.list.numbered": {
    fg: RGBA.fromHex("#72B7D6"),
  },

  "markup.list.unnumbered": {
    fg: RGBA.fromHex("#72B7D6"),
  },

  // Quotes
  "markup.quote": {
    fg: RGBA.fromHex("#9BA9B5"),
    italic: true,
  },

  // Inline code
  "markup.raw": {
    fg: RGBA.fromHex("#78D0C5"),
  },

  // Code blocks
  "markup.raw.block": {
    fg: RGBA.fromHex("#B8C6D0"),
  },

  // Links
  "markup.link": {
    fg: RGBA.fromHex("#6DBBE3"),
    underline: true,
  },

  "markup.link.url": {
    fg: RGBA.fromHex("#6DBBE3"),
    underline: true,
  },
});

const thinkingMarkdownSyntaxStyle = SyntaxStyle.fromStyles({
  default: {
    fg: RGBA.fromHex("#718C9B"),
  },

  "markup.heading": {
    fg: RGBA.fromHex("#7FA9B8"),
    bold: true,
  },

  "markup.heading.1": {
    fg: RGBA.fromHex("#82AEBE"),
    bold: true,
  },

  "markup.heading.2": {
    fg: RGBA.fromHex("#7FA9B8"),
    bold: true,
  },

  "markup.heading.3": {
    fg: RGBA.fromHex("#7899A7"),
    bold: true,
  },

  "markup.bold": {
    fg: RGBA.fromHex("#8FA3AF"),
    bold: true,
  },

  "markup.strong": {
    fg: RGBA.fromHex("#8FA3AF"),
    bold: true,
  },

  "markup.italic": {
    fg: RGBA.fromHex("#858297"),
    italic: true,
  },

  "markup.list": {
    fg: RGBA.fromHex("#718F9F"),
  },

  "markup.list.numbered": {
    fg: RGBA.fromHex("#718F9F"),
  },

  "markup.list.unnumbered": {
    fg: RGBA.fromHex("#718F9F"),
  },

  "markup.quote": {
    fg: RGBA.fromHex("#687780"),
    italic: true,
  },

  "markup.raw": {
    fg: RGBA.fromHex("#709D9A"),
  },

  "markup.raw.block": {
    fg: RGBA.fromHex("#7D909A"),
  },

  "markup.link": {
    fg: RGBA.fromHex("#7094A7"),
    underline: true,
  },

  "markup.link.url": {
    fg: RGBA.fromHex("#7094A7"),
    underline: true,
  },
});