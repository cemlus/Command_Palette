# Command Palette

Command Palette is a Chrome Extension that opens a quick launcher overlay in the current tab and lets you search across browser data in one place.

## What It Does

- Searches open tabs, bookmarks, history, and recently closed tabs
- Opens results with keyboard-first navigation
- Focuses existing tabs or restores closed tabs when applicable
- Falls back to opening URLs in a new tab for bookmark/history results

## Keyboard Shortcut

- `Ctrl+Shift+K` (Windows/Linux)
- `Command+Shift+K` (macOS)

The extension also supports clicking the toolbar icon to toggle the palette.

## Tech Stack

- React 19 + TypeScript
- Vite (separate builds for background and content script)
- Chrome Extension Manifest V3

## Project Structure

```text
public/
  manifest.json            # extension manifest copied into dist
src/
  background/index.ts      # command handlers + search/open logic
  content/index.tsx        # content script mount/toggle + message handling
  palette/                 # React command palette UI
  types/                   # shared types
vite.config.ts             # background build config
vite.content.config.ts     # content script build config
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Runs both background and content script builds in watch mode.

## Production Build

```bash
npm run build
```

Build output is generated in `dist/`.

## Load in Chrome

1. Run `npm run build` (or keep `npm run dev` running).
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the project's `dist/` directory.
6. Use `Ctrl+Shift+K` / `Command+Shift+K` to toggle the palette.

## NPM Scripts

- `npm run dev` - watch build for `background` and `content`
- `npm run build` - build both targets once
- `npm run build:bg` - build only background script
- `npm run build:content` - build only content script

## Permissions

Defined in `public/manifest.json`:

- `tabs` - enumerate/focus tabs
- `bookmarks` - search bookmarks
- `history` - search browser history
- `sessions` - restore recently closed tabs
- `scripting` - inject content script when needed
- `storage` - reserved for extension state
- `host_permissions: <all_urls>` - run content script on pages
