import { RGBA, SyntaxStyle } from "@opentui/core";

export const COLORS = {
  blue: "#7aa2f7",
  green: "#9ece6a",
  amber: "#e0af68",
  red: "#f7768e",
  cyan: "#7dcfff",
  magenta: "#bb9af7",
  yellow: "#e0af68",
  dim: "#565f89",
  front: "#a9b1d6",
  border: "#2ac3de",
  bg: "#16161e",
  selection: "#1e2030",
  transparent: "transparent",

  // Markdown — normal
  mdText: "#C4CDD6",
  mdHeading: "#72C7E8",
  mdHeading1: "#7DD3F0",
  mdHeading3: "#86BDD2",
  mdBold: "#E1E7EC",
  mdItalic: "#C7BDE2",
  mdList: "#72B7D6",
  mdQuote: "#9BA9B5",
  mdInlineCode: "#78D0C5",
  mdCodeBlock: "#B8C6D0",
  mdLink: "#6DBBE3",

  // Markdown — thinking (dimmed)
  thinkingText: "#718C9B",
  thinkingHeading: "#7FA9B8",
  thinkingHeading1: "#82AEBE",
  thinkingHeading3: "#7899A7",
  thinkingBold: "#8FA3AF",
  thinkingItalic: "#858297",
  thinkingList: "#718F9F",
  thinkingQuote: "#687780",
  thinkingInlineCode: "#709D9A",
  thinkingCodeBlock: "#7D909A",
  thinkingLink: "#7094A7",
};

export const markdownSyntaxStyle = SyntaxStyle.fromStyles({
  // Normal text
  default: {
    fg: RGBA.fromHex(COLORS.mdText),
  },

  // Headings
  "markup.heading": {
    fg: RGBA.fromHex(COLORS.mdHeading),
    bold: true,
  },

  "markup.heading.1": {
    fg: RGBA.fromHex(COLORS.mdHeading1),
    bold: true,
  },

  "markup.heading.2": {
    fg: RGBA.fromHex(COLORS.mdHeading),
    bold: true,
  },

  "markup.heading.3": {
    fg: RGBA.fromHex(COLORS.mdHeading3),
    bold: true,
  },

  // Bold / strong
  "markup.bold": {
    fg: RGBA.fromHex(COLORS.mdBold),
    bold: true,
  },

  "markup.strong": {
    fg: RGBA.fromHex(COLORS.mdBold),
    bold: true,
  },

  // Italic
  "markup.italic": {
    fg: RGBA.fromHex(COLORS.mdItalic),
    italic: true,
  },

  // Lists
  "markup.list": {
    fg: RGBA.fromHex(COLORS.mdList),
  },

  "markup.list.numbered": {
    fg: RGBA.fromHex(COLORS.mdList),
  },

  "markup.list.unnumbered": {
    fg: RGBA.fromHex(COLORS.mdList),
  },

  // Quotes
  "markup.quote": {
    fg: RGBA.fromHex(COLORS.mdQuote),
    italic: true,
  },

  // Inline code
  "markup.raw": {
    fg: RGBA.fromHex(COLORS.mdInlineCode),
  },

  // Code blocks
  "markup.raw.block": {
    fg: RGBA.fromHex(COLORS.mdCodeBlock),
  },

  // Links
  "markup.link": {
    fg: RGBA.fromHex(COLORS.mdLink),
    underline: true,
  },

  "markup.link.url": {
    fg: RGBA.fromHex(COLORS.mdLink),
    underline: true,
  },
});

export const thinkingMarkdownSyntaxStyle = SyntaxStyle.fromStyles({
  default: {
    fg: RGBA.fromHex(COLORS.thinkingText),
  },

  "markup.heading": {
    fg: RGBA.fromHex(COLORS.thinkingHeading),
    bold: true,
  },

  "markup.heading.1": {
    fg: RGBA.fromHex(COLORS.thinkingHeading1),
    bold: true,
  },

  "markup.heading.2": {
    fg: RGBA.fromHex(COLORS.thinkingHeading),
    bold: true,
  },

  "markup.heading.3": {
    fg: RGBA.fromHex(COLORS.thinkingHeading3),
    bold: true,
  },

  "markup.bold": {
    fg: RGBA.fromHex(COLORS.thinkingBold),
    bold: true,
  },

  "markup.strong": {
    fg: RGBA.fromHex(COLORS.thinkingBold),
    bold: true,
  },

  "markup.italic": {
    fg: RGBA.fromHex(COLORS.thinkingItalic),
    italic: true,
  },

  "markup.list": {
    fg: RGBA.fromHex(COLORS.thinkingList),
  },

  "markup.list.numbered": {
    fg: RGBA.fromHex(COLORS.thinkingList),
  },

  "markup.list.unnumbered": {
    fg: RGBA.fromHex(COLORS.thinkingList),
  },

  "markup.quote": {
    fg: RGBA.fromHex(COLORS.thinkingQuote),
    italic: true,
  },

  "markup.raw": {
    fg: RGBA.fromHex(COLORS.thinkingInlineCode),
  },

  "markup.raw.block": {
    fg: RGBA.fromHex(COLORS.thinkingCodeBlock),
  },

  "markup.link": {
    fg: RGBA.fromHex(COLORS.thinkingLink),
    underline: true,
  },

  "markup.link.url": {
    fg: RGBA.fromHex(COLORS.thinkingLink),
    underline: true,
  },
});
