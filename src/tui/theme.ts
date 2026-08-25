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
};

export const markdownSyntaxStyle = SyntaxStyle.fromStyles({
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

export const thinkingMarkdownSyntaxStyle = SyntaxStyle.fromStyles({
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