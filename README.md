# Arc

Arc is a Chrome Extension command palette that lets you quickly search and open:

- Open tabs
- Bookmarks
- Browsing history
- Recently closed tabs

The palette opens as an overlay and is designed for keyboard-first navigation.

## Features

- **Global shortcut**: `Ctrl+Shift+K` (`Command+Shift+K` on macOS)
- **Unified search** across tabs, bookmarks, history, and recently closed sessions
- **Fast keyboard flow**:
  - `↑` / `↓` to move
  - `Enter` to open
  - `Esc` to close
- **Result-specific behavior**:
  - Existing tab results focus the tab and its window
  - Closed tab results restore the session
  - Bookmark/history results open in a new tab

## Tech Stack

- React 19 + TypeScript
- Vite
- Chrome Extensions Manifest V3 (service worker background)

## Project Structure

```text
src/
  background/   # command + search/open logic
  content/      # content script entry (currently placeholder)
  palette/      # React UI for the command palette
  types/        # shared extension types
manifest.json   # extension manifest
```

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: latest LTS)
- npm
- Chrome (or Chromium-based browser with extension dev mode)

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Starts Vite dev server for local iteration.

### Build

```bash
npm run build
```

This runs TypeScript build checks and produces a production bundle in `dist/`.

## Load the Extension in Chrome

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select this project's `dist/` directory.
6. Use the shortcut (`Ctrl+Shift+K` / `Command+Shift+K`) to toggle the palette.

## Scripts

- `npm run dev` - start Vite dev server
- `npm run build` - type-check and build production assets
- `npm run lint` - run ESLint
- `npm run preview` - preview the Vite production build

## Permissions Used

From `manifest.json`:

- `tabs` - list and focus tabs
- `bookmarks` - search bookmarks
- `history` - search browsing history
- `sessions` - restore recently closed tabs
- `storage` - reserved for persisted extension state

## Notes

- The current `content` entrypoint is a placeholder; palette injection/toggling should be wired there as development continues.
- TypeScript strict settings are enabled for the app source.
