export type ResultType = "tab" | "bookmark" | "history" | "closed-tab";

export interface PaletteResult {
  id: string;
  type: ResultType;
  title: string;
  url: string;
  favIconUrl?: string;
  tabId?: number;
  sessionId?: string;
}

export type MessageType =
  | { type: "TOGGLE_PALETTE" }
  | { type: "SEARCH"; query: string }
  | { type: "SEARCH_RESULTS"; results: PaletteResult[] }
  | { type: "OPEN_RESULT"; result: PaletteResult };