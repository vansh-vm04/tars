import type { ModelDefinition } from "../types.js";

export const availableProviders = ["google"] as const;

const modelsToShow = [
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];

const fallbackModels: ModelDefinition[] = [
  {
    id: "gemini-3.6-flash",
    name: "Gemini 3.6 Flash",
    contextWindow: 1_048_576,
    maxTokens: 65_536,
    reasoning: true,
    provider: "google",
  },
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    contextWindow: 1_048_576,
    maxTokens: 65_536,
    reasoning: true,
    provider: "google",
  },
  {
    id: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash-Lite",
    contextWindow: 1_048_576,
    maxTokens: 65_536,
    reasoning: true,
    provider: "google",
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash-Lite",
    contextWindow: 1_048_576,
    maxTokens: 65_536,
    reasoning: true,
    provider: "google",
  },
];

const normalizeModel = (
  provider: string,
  rawModel: any,
): ModelDefinition | null => {
  const id = rawModel?.id ?? rawModel?.name ?? "";
  if (!id) return null;

  const contextWindow = Number(
    rawModel?.limit?.context ??
      rawModel?.context_window ??
      rawModel?.contextWindow ??
      rawModel?.max_context ??
      0,
  );

  const maxTokens = Number(
    rawModel?.limit?.output ?? rawModel?.max_tokens ?? rawModel?.maxTokens ?? 0,
  );

  return {
    id: String(id),
    name: String(rawModel?.name ?? id),
    contextWindow: Number.isFinite(contextWindow) ? contextWindow : 4096,
    maxTokens: Number.isFinite(maxTokens) ? maxTokens : 4096,
    reasoning: Boolean(rawModel?.reasoning ?? false),
    provider: provider as "google",
  };
};

const loadModelsFromDev = async (): Promise<ModelDefinition[]> => {
  const response = await fetch("https://models.dev/api.json");
  if (!response.ok) {
    throw new Error(`Failed to fetch model list: ${response.status}`);
  }

  const payload = (await response.json()) as Record<string, any>;
  const googleProvider = payload?.google;
  const rawModels =
    googleProvider?.models.filter((m: any) =>
      modelsToShow.includes(m.id || m.name),
    ) ?? {};

  const models = Object.values(rawModels)
    .map((rawModel: any) => normalizeModel("google", rawModel))
    .filter(
      (model): model is ModelDefinition => !!model && model.contextWindow > 0,
    );

  return models.length > 0 ? models : fallbackModels;
};

let cachedModels: ModelDefinition[] | null = null;

export const getAvailableModels = async (): Promise<ModelDefinition[]> => {
  if (cachedModels) return cachedModels;
  cachedModels = await loadModelsFromDev().catch(() => fallbackModels);
  return cachedModels;
};
