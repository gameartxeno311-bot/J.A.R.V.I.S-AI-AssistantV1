# EB Interface

The `public/` directory is the browser client for the J.A.R.V.I.S. assistant. It recreates the supplied red-on-black EB dashboard as an interactive PC-ready control surface while using the existing Express/TypeScript backend.

## PC launch

1. Install Node.js 20+.
2. From the repository root run `npm install`.
3. Run `npm run dev` for development, or `npm run build` followed by `npm start` for the production build.
4. Open `http://localhost:8787/` in a desktop browser.

## EB interface controls

- **EB** button in the top bar toggles EB focus mode, expanding the central command surface.
- **Ctrl + Alt + E** toggles EB focus mode from the keyboard.
- **Open EB visual reference** opens `public/assets/eb-interface.svg` in a new browser tab.
- Conversation, voice input/output, diagnostics, memory, status polling, and quick actions continue to use the existing assistant API.
- Browser speech recognition is used when supported; speech synthesis provides local voice output.
- Stop cancels active speech and recognition.
- The layout remains responsive, while desktop/PC is the primary presentation target.

## Asset

`public/assets/eb-interface.svg` is a lightweight vector reconstruction of the supplied EB interface reference, committed as a browser-friendly image asset. The interactive dashboard is implemented as HTML/CSS/JavaScript rather than a screenshot so its controls remain usable.

The frontend intentionally does not contain API keys or privileged tool execution. Sensitive integrations remain server-side.
