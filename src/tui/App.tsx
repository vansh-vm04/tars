import { useCallback, useEffect, useMemo, useState } from "react";
import { useKeyboard } from "@opentui/react";
import { UiStore, applyAgentEvent } from "./store.js";
import { availableCommands } from "../commands/index.js";
import {
  Header,
  MessageList,
  Composer,
  ApiKeyDialog,
  ModelPicker,
  SessionPicker,
  COLORS,
} from "./components/index.js";
import { readAuth, saveAuth } from "../storage/auth.js";
import { readConfig, saveConfig } from "../storage/config.js";
import { getAvailableModels } from "../providers/models.js";
import { GoogleProvider } from "../providers/google-provider.js";
import { Agent } from "../agent.js";
import { availableTools } from "../tools/index.js";
import type { ModelDefinition, Session } from "../types.js";
import type { AuthConfig, Config } from "../types.js";

type Stage = "loading" | "auth" | "model" | "ready";
type Overlay = "none" | "help" | "model" | "session";

export type AppProps = {
  onExit: () => void;
};

export const App = ({ onExit }: AppProps) => {
  const ui = useMemo(() => new UiStore(), []);
  const [stage, setStage] = useState<Stage>("loading");
  const [overlay, setOverlay] = useState<Overlay>("none");
  const [auth, setAuth] = useState<AuthConfig | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [model, setModel] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [models, setModels] = useState<ModelDefinition[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  const startAgent = useCallback(
    (a: AuthConfig, config: Config) => {
      const provider = new GoogleProvider(a.apiKey);
      const nextAgent = new Agent(
        config.model,
        { messages: [], tools: availableTools },
        provider,
      );
      nextAgent.onEvent((event) => applyAgentEvent(ui, event));
      setAgent(nextAgent);
      setModel(nextAgent.modelName);
      setStage("ready");
    },
    [ui],
  );

  const configStage = useCallback(
    async (a: AuthConfig) => {
      const config = await readConfig();
      if (!config) {
        setStage("model");
        return;
      }
      startAgent(a, config);
    },
    [startAgent],
  );

  const boot = useCallback(async () => {
    const stored = await readAuth();
    if (stored) {
      setAuth(stored);
      await configStage(stored);
      return;
    }
    setStage("auth");
  }, [configStage]);

  useEffect(() => {
    void boot();
    void getAvailableModels().then(setModels);
  }, [boot]);

  useKeyboard(
    useCallback(
      (key) => {
        if (key.name === "c" && key.ctrl) onExit();
      },
      [onExit],
    ),
  );

  const handleAuthKey = useCallback(
    async (apiKey: string) => {
      const nextAuth: AuthConfig = { provider: "google", apiKey };
      try {
        await saveAuth(nextAuth);
      } catch (error) {
        ui.pushError(`Failed to save auth: ${String(error)}`);
      }
      setAuth(nextAuth);
      await configStage(nextAuth);
    },
    [configStage, ui],
  );

  const handlePickModel = useCallback(
    async (definition: ModelDefinition) => {
      const config: Config = {
        provider: definition.provider,
        model: definition.id,
      };
      await saveConfig(config);
      if (agent) {
        await agent.setModelName(config.model);
        setModel(config.model);
      } else {
        const a = auth ?? (await readAuth());
        if (a) startAgent(a, config);
      }
      setOverlay("none");
    },
    [agent, auth, startAgent],
  );

  const handleCommand = useCallback(
    (cmd: string) => {
      const command = availableCommands.find((c) => c.name === cmd);
      if (!command) {
        ui.addSystemMessage(`unknown command: ${cmd}`);
        return;
      }
      void command.execute({
        agent,
        ui,
        setOverlay,
        setSessions,
        onExit,
      });
      setSessionName(agent?.currentSessionName || "New Session");
    },
    [agent, ui, onExit],
  );

  const handleSubmit = useCallback(
    (input: string, tag: "command" | "prompt") => {
      if (tag === "command") {
        handleCommand(input);
        return;
      }
      const current = agent;
      if (!current) return;
      ui.addUserMessage(input);
      ui.setStreaming(true);
      ui.setStatus("working…");
      void current
        .prompt(input)
        .then((result) => {
          if (result.isError) ui.pushError("No output produced.");
          setSessionName(current.currentSessionName || "New Session");
        })
        .catch((error: unknown) => {
          ui.pushError(String(error));
        })
        .finally(() => {
          ui.setStreaming(false);
          ui.setStatus("");
        });
    },
    [agent, ui, handleCommand],
  );

  if (stage === "loading") {
    return (
      <box
        width="100%"
        height="100%"
        alignItems="center"
        justifyContent="center"
        backgroundColor={COLORS.bg}
      >
        <text fg={COLORS.green}>
          <strong>TARS… loading</strong>
        </text>
      </box>
    );
  }

  if (stage === "auth") {
    return <ApiKeyDialog onSubmit={handleAuthKey} onCancel={onExit} />;
  }

  if (stage === "model") {
    return (
      <ModelPicker models={models} onPick={handlePickModel} onCancel={onExit} />
    );
  }

  if (overlay === "model") {
    return (
      <ModelPicker
        models={models}
        onPick={handlePickModel}
        onCancel={() => setOverlay("none")}
      />
    );
  }

  if (overlay === "session") {
    return (
      <SessionPicker
        sessions={sessions}
        onPick={async (session) => {
          const current = agent;
          if (current) {
            await current.loadSession(session.id);
            ui.clear();
            ui.loadMessages(current.messagesList);
            setSessionName(session.name);
          }
          setOverlay("none");
        }}
        onCancel={() => setOverlay("none")}
      />
    );
  }

  return (
    <box
      width="100%"
      height="100%"
      flexDirection="column"
      backgroundColor={COLORS.bg}
    >
      <Header sessionName={sessionName} />
      <box flexGrow={1} width="100%" flexDirection="column" overflow="hidden">
        <MessageList store={ui} />
      </box>
      <Composer store={ui} model={model} onSubmit={handleSubmit} />
    </box>
  );
};
