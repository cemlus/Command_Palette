import { useEffect, useRef, useState, useCallback } from "react";
import type { PaletteResult } from "../types";
import "./palette.css";

interface Props {
    visible: boolean;
    onClose: () => void;
}

const TYPE_META: Record<string, { label: string; icon: string }> = {
    tab: { label: "Tab", icon: "⬡" },
    bookmark: { label: "Bookmark", icon: "◈" },
    history: { label: "History", icon: "◷" },
    "closed-tab": { label: "Closed", icon: "◻" },
};

export default function App({ visible, onClose }: Props) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<PaletteResult[]>([]);
    const [selected, setSelected] = useState(0);
    const [rendered, setRendered] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const search = useCallback((q: string) => {
        // @ts-ignore
        chrome.runtime.sendMessage({ type: "SEARCH", query: q }, (res: PaletteResult[]) => {
            setResults(res ?? []);
            setSelected(0);
        });
    }, []);

    // Mount/unmount with animation frame
    useEffect(() => {
        if (visible) {
            setRendered(true);
            setQuery("");
            search("");
            setTimeout(() => inputRef.current?.focus(), 30);
        } else {
            const t = setTimeout(() => setRendered(false), 220);
            return () => clearTimeout(t);
        }
    }, [visible]);

    useEffect(() => {
        const id = setTimeout(() => search(query), 120);
        return () => clearTimeout(id);
    }, [query]);

    // Scroll selected item into view
    useEffect(() => {
        const el = listRef.current?.children[selected] as HTMLElement | undefined;
        el?.scrollIntoView({ block: "nearest" });
    }, [selected]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (!visible) return;
            if (e.key === "Escape") { e.preventDefault(); onClose(); }
            if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
            if (e.key === "Enter" && results[selected]) openResult(results[selected]);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [visible, results, selected]);

    function openResult(result: PaletteResult) {
        // @ts-ignore
        chrome.runtime.sendMessage({ type: "OPEN_RESULT", result });
        onClose();
    }

    if (!rendered) return null;

    return (
        <div className={`cp-overlay ${visible ? "cp-overlay--in" : "cp-overlay--out"}`}
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className={`cp-panel ${visible ? "cp-panel--in" : "cp-panel--out"}`}>

                {/* Search bar */}
                <div className="cp-search-row">
                    <svg className="cp-search-icon" viewBox="0 0 16 16" fill="none">
                        <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                        <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                    <input
                        ref={inputRef}
                        className="cp-input"
                        placeholder="Search tabs, bookmarks, history…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        spellCheck={false}
                    />
                    <kbd className="cp-esc">esc</kbd>
                </div>

                {/* Divider */}
                <div className="cp-divider" />

                {/* Section label */}
                {results.length > 0 && (
                    <div className="cp-section-label">
                        {query ? `${results.length} results` : "Recent"}
                    </div>
                )}

                {/* Results */}
                <ul className="cp-list" ref={listRef}>
                    {results.length === 0 && (
                        <li className="cp-empty">
                            <span className="cp-empty-icon">⌕</span>
                            No results for <strong>"{query}"</strong>
                        </li>
                    )}
                    {results.map((r, i) => {
                        const meta = TYPE_META[r.type];
                        return (
                            <li
                                key={r.id}
                                className={`cp-item ${i === selected ? "cp-item--active" : ""}`}
                                onMouseEnter={() => setSelected(i)}
                                onMouseDown={() => openResult(r)}
                            >
                                <span className="cp-type-icon">{meta.icon}</span>
                                {r.favIconUrl
                                    ? <img className="cp-favicon" src={r.favIconUrl} alt="" />
                                    : <span className="cp-favicon cp-favicon--fallback" />}
                                <span className="cp-title">{r.title || "Untitled"}</span>
                                <span className="cp-url">{formatUrl(r.url)}</span>
                                <span className={`cp-badge cp-badge--${r.type}`}>{meta.label}</span>
                                {i === selected && <span className="cp-enter-hint">↵</span>}
                            </li>
                        );
                    })}
                </ul>

                {/* Footer */}
                <div className="cp-footer">
                    <span><kbd>↑↓</kbd> navigate</span>
                    <span><kbd>↵</kbd> open</span>
                    <span><kbd>esc</kbd> close</span>
                </div>
            </div>
        </div>
    );
}

function formatUrl(url: string): string {
    try {
        const u = new URL(url);
        return u.hostname.replace(/^www\./, "");
    } catch {
        return url;
    }
}