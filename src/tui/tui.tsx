#!/usr/bin/env node
import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./App.js";

const renderer = await createCliRenderer({
  exitOnCtrlC: false,
});

const root = createRoot(renderer);

root.render(
  <App
    onExit={() => {
      try {
        root.unmount();
      } catch {
        /* already unmounted */
      }
      renderer.destroy();
      process.exit(0);
    }}
  />,
);