# EB Interface

The `public/` directory is the browser client for the J.A.R.V.I.S. assistant. It recreates the supplied red-on-black EB dashboard as a responsive, accessible control surface while using the existing backend rather than creating a second application.

## Runtime behavior

- Dashboard is served by the Express API at `/`.
- Conversation submits to `POST /api/assistant/message`.
- System health polls `GET /api/assistant/status`.
- Tool inventory is available from `GET /api/tools`.
- Browser speech recognition is used when supported by the browser; transcripts are submitted to the same assistant endpoint.
- Browser speech synthesis provides a local voice-output fallback without exposing provider credentials.
- Stop cancels active speech and recognition.
- The UI is responsive and collapses secondary panels on smaller screens.

The frontend intentionally does not contain API keys or privileged tool execution. All sensitive integrations remain server-side.
