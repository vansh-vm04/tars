export type ViewMessageRole = "user" | "assistant" | "system" | "error";

export type ViewToolCall = {
  id: string;
  name: string;
  label: string;
  status: "running" | "done";
};

export type ViewMessage = {
  id: string;
  role: ViewMessageRole;
  text: string;
  thinking: string;
  thinkingOpen: boolean;
  toolCalls: ViewToolCall[];
  finished: boolean;
};
