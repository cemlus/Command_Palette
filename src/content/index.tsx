import { createRoot } from "react-dom/client";
import App from "../palette/App";

// Prevent double-injection after programmatic re-inject
if (!(window as any).__cmdPaletteLoaded) {
  (window as any).__cmdPaletteLoaded = true;

  let visible = false;
  let root: ReturnType<typeof createRoot> | null = null;

  function getRoot() {
    if (!root) {
      const container = document.createElement("div");
      container.id = "cmd-palette-root";
      container.style.cssText =
        "all:unset;position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;pointer-events:none;";
      document.documentElement.appendChild(container);
      root = createRoot(container);
    }
    return root;
  }

  function render() {
    getRoot().render(
      <App visible={visible} onClose={() => { visible = false; render(); }} />
    );
  }

  // ✅ ADD IT HERE
  window.addEventListener(
    "keydown",
    (e) => {
      const isMac = navigator.platform.includes("Mac");
      const trigger = isMac
        ? e.metaKey && e.shiftKey && e.key.toLowerCase() === "k"
        : e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "k";

      if (trigger) {
        e.preventDefault();
        e.stopPropagation();
        visible = !visible;
        render();
      }
    },
    true // capture phase
  );

  // @ts-ignore
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === "PING") {
      sendResponse({ alive: true });
      return;
    }
    if (msg.type === "TOGGLE_PALETTE") {
      visible = !visible;
      render();
    }
  });
}