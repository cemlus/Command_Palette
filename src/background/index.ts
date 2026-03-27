import type { PaletteResult } from "../types";

function isRestrictedUrl(url: string | undefined): boolean {
  if (!url) return true;
  return (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("devtools://") ||
    url.startsWith("about:") ||
    url.startsWith("edge://")
  );
}

function toggleOnTab(tabId: number) {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || isRestrictedUrl(tab.url)) {
      console.warn("[CMD] Restricted tab — opening palette in a new tab instead");
      chrome.tabs.create({ url: "https://www.google.com" }, (newTab) => {
        if (newTab.id) {
          setTimeout(() => chrome.tabs.sendMessage(newTab.id!, { type: "TOGGLE_PALETTE" }), 800);
        }
      });
      return;
    }

    chrome.tabs.sendMessage(tabId, { type: "PING" }, (res) => {
      if (chrome.runtime.lastError || !res?.alive) {
        chrome.scripting.executeScript(
          { target: { tabId }, files: ["content.js"] },
          () => {
            if (chrome.runtime.lastError) {
              console.error("[CMD] inject failed:", chrome.runtime.lastError.message);
              return;
            }
            setTimeout(() => chrome.tabs.sendMessage(tabId, { type: "TOGGLE_PALETTE" }), 150);
          }
        );
      } else {
        chrome.tabs.sendMessage(tabId, { type: "TOGGLE_PALETTE" });
      }
    });
  });
}

function getActiveTab(cb: (tabId: number) => void) {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.id) cb(tab.id);
    else console.error("[CMD] No active tab found");
  });
}

// Keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  console.log("[CMD] command fired:", command);
  if (command === "toggle-palette") getActiveTab(toggleOnTab);
});

// Icon click
chrome.action.onClicked.addListener((tab) => {
  console.log("[CMD] action clicked, tab:", tab.id);
  if (tab.id) toggleOnTab(tab.id);
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "SEARCH") {
    handleSearch(msg.query).then(sendResponse);
    return true;
  }
  if (msg.type === "OPEN_RESULT") {
    openResult(msg.result);
  }
});

async function handleSearch(query: string): Promise<PaletteResult[]> {
  const q = query.toLowerCase();

  const [tabs, bookmarks, historyItems, sessions] = await Promise.all([
    chrome.tabs.query({}),
    query ? chrome.bookmarks.search(query) : chrome.bookmarks.getRecent(10),
    chrome.history.search({ text: query, maxResults: 10, startTime: 0 }),
    chrome.sessions.getRecentlyClosed({ maxResults: 10 }),
  ]);

  const tabResults: PaletteResult[] = tabs
    .filter((t) => matches(q, t.title, t.url))
    .map((t) => ({
      id: `tab-${t.id}`,
      type: "tab",
      title: t.title || "Untitled",
      url: t.url || "",
      favIconUrl: t.favIconUrl,
      tabId: t.id,
    }));

  const bookmarkResults: PaletteResult[] = bookmarks
    .filter((b) => b.url && matches(q, b.title, b.url))
    .slice(0, 10)
    .map((b) => ({
      id: `bookmark-${b.id}`,
      type: "bookmark",
      title: b.title || "Untitled",
      url: b.url!,
    }));

  const historyResults: PaletteResult[] = historyItems
    .filter((h) => matches(q, h.title, h.url))
    .map((h) => ({
      id: `history-${h.id}`,
      type: "history",
      title: h.title || "Untitled",
      url: h.url || "",
    }));

  const closedResults: PaletteResult[] = sessions
    .flatMap((s) => {
      const entry = s.tab ?? s.window?.tabs?.[0];
      if (!entry) return [];
      return [{
        id: `closed-${entry.sessionId ?? entry.url}`,
        type: "closed-tab" as const,
        title: entry.title || "Untitled",
        url: entry.url || "",
        favIconUrl: entry.favIconUrl,
        sessionId: entry.sessionId,
      }];
    })
    .filter((r) => matches(q, r.title, r.url));

  return [...tabResults, ...bookmarkResults, ...historyResults, ...closedResults].slice(0, 30);
}

function matches(q: string, ...fields: (string | undefined)[]): boolean {
  if (!q) return true;
  return fields.some((f) => f?.toLowerCase().includes(q));
}

function openResult(result: PaletteResult) {
  if (result.type === "tab" && result.tabId != null) {
    chrome.tabs.update(result.tabId, { active: true });
    chrome.tabs.get(result.tabId, (t) => chrome.windows.update(t.windowId, { focused: true }));
    return;
  }
  if (result.type === "closed-tab" && result.sessionId) {
    chrome.sessions.restore(result.sessionId);
    return;
  }
  chrome.tabs.create({ url: result.url });
}