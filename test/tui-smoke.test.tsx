import { testRender } from "@opentui/react/test-utils";
import { App } from "../src/tui/App.js";

const renderer = await testRender(<App onExit={() => {}} />, {
  width: 90,
  height: 24,
});
await renderer.renderOnce();
await renderer.flush();

await new Promise((resolve) => setTimeout(resolve, 300));
await renderer.flush();

let frame = "";
for (let i = 0; i < 80; i++) {
  frame = renderer.captureCharFrame();
  if (!frame.includes("TARS… loading")) break;
  await renderer.flush();
  await new Promise((resolve) => setTimeout(resolve, 50));
}

console.log("=== APP FRAME ===");
console.log(frame);
console.log("=== END ===");

process.exit(0);