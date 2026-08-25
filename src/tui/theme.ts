import { RGBA, SyntaxStyle } from "@opentui/core";

export const COLORS = {
  // Core
  blue: "#7FA8FF",
  green: "#91D47A",
  amber: "#F0B86E",
  red: "#FF7F91",
  cyan: "#63D5E3",
  magenta: "#C29AFF",
  yellow: "#F2D477",

  dim: "#68758C",
  front: "#D2D9E4",

  border: "#7FA8FF",
  bg: "#10151D",
  selection: "#202A38",
  transparent: "transparent",

  // Markdown — normal
  mdText: "#D0D7E0",
  mdHeading: "#63D1E5",
  mdHeading1: "#7BDEF0",
  mdHeading3: "#70C7DA",
  mdBold: "#EEF2F6",
  mdItalic: "#CFBFFF",
  mdList: "#63C4DC",
  mdQuote: "#AAB8C7",
  mdInlineCode: "#63D6C2",
  mdCodeBlock: "#C4D0DB",
  mdLink: "#70C9F0",

  // Markdown — thinking
  thinkingText: "#7E91A3",
  thinkingHeading: "#82B5C5",
  thinkingHeading1: "#91C5D4",
  thinkingHeading3: "#80ADBC",
  thinkingBold: "#A3B4C1",
  thinkingItalic: "#978EAD",
  thinkingList: "#7CA8B8",
  thinkingQuote: "#71818E",
  thinkingInlineCode: "#75AEA5",
  thinkingCodeBlock: "#8EA4B0",
  thinkingLink: "#79A9C0",
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
