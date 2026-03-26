import type { PaletteResult } from "../types";
// @ts-ignore
chrome.commands.onCommand.addListener((command) => {
    if (command !== "toggle-palette") return;
    
    // @ts-ignore
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (!tab?.id) return;
        
        // Ping first — if content script is alive, toggle it
        // @ts-ignore
        chrome.tabs.sendMessage(tab.id, { type: "PING" }, (res) => {
        // @ts-ignore
        if (chrome.runtime.lastError || !res?.alive) {
            // Content script not ready — inject it programmatically then toggle
            // @ts-ignore
            chrome.scripting.executeScript(
                { target: { tabId: tab.id! }, files: ["content.js"] },
                () => {
              // @ts-ignore
              if (chrome.runtime.lastError) return;
              setTimeout(() => {
                // @ts-ignore
              chrome.tabs.sendMessage(tab.id!, { type: "TOGGLE_PALETTE" });
            }, 100);
          }
        );
      } else {
        // @ts-ignore
        chrome.tabs.sendMessage(tab.id!, { type: "TOGGLE_PALETTE" });
      }
    });
  });
});
// @ts-ignore
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
    // @ts-ignore
    chrome.tabs.query({}),
    // @ts-ignore
    query ? chrome.bookmarks.search(query) : chrome.bookmarks.getRecent(10),
    // @ts-ignore
    chrome.history.search({ text: query, maxResults: 10, startTime: 0 }),
    // @ts-ignore
    chrome.sessions.getRecentlyClosed({ maxResults: 10 }),
  ]);

  const tabResults: PaletteResult[] = tabs
    .filter((t: any) => matches(q, t.title, t.url))
    .map((t: any) => ({
      id: `tab-${t.id}`,
      type: "tab",
      title: t.title || "Untitled",
      url: t.url || "",
      favIconUrl: t.favIconUrl,
      tabId: t.id,
    }));

  const bookmarkResults: PaletteResult[] = bookmarks
    .filter((b: any) => b.url && matches(q, b.title, b.url))
    .slice(0, 10)
    .map((b: any) => ({
      id: `bookmark-${b.id}`,
      type: "bookmark",
      title: b.title || "Untitled",
      url: b.url!,
    }));

  const historyResults: PaletteResult[] = historyItems
    .filter((h: any) => matches(q, h.title, h.url))
    .map((h: any) => ({
      id: `history-${h.id}`,
      type: "history",
      title: h.title || "Untitled",
      url: h.url || "",
    }));

  const closedResults: PaletteResult[] = sessions
    .flatMap((s: any) => {
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
    .filter((r: any) => matches(q, r.title, r.url));

  return [...tabResults, ...bookmarkResults, ...historyResults, ...closedResults].slice(0, 30);
}

function matches(q: string, ...fields: (string | undefined)[]): boolean {
  if (!q) return true;
  return fields.some((f) => f?.toLowerCase().includes(q));
}

function openResult(result: PaletteResult) {
  if (result.type === "tab" && result.tabId != null) {
    // @ts-ignore
    chrome.tabs.update(result.tabId, { active: true });
    // @ts-ignore
    chrome.tabs.get(result.tabId, (t) => chrome.windows.update(t.windowId, { focused: true }));
    return;
}
if (result.type === "closed-tab" && result.sessionId) {
      // @ts-ignore
      chrome.sessions.restore(result.sessionId);
      return;
    }
    // @ts-ignore
  chrome.tabs.create({ url: result.url });
}