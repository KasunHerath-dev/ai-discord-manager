# Architecture

```text
Browser UI (localhost)
       │
       ▼
Node HTTP router ── encrypted local settings / plans / audit / snapshots
       │
       ├── Gemini planner (structural snapshot + user prompt → JSON plan)
       │
       ├── Safety policy (independent risk and permission validation)
       │
       └── Discord executor (approved JSON actions → Discord REST API)
```

## Trust boundaries

- Credentials enter only the local setup route.
- Gemini receives the server structure and user request, never credentials.
- Gemini cannot issue network requests from the application.
- Discord receives only actions that passed local validation and user approval.
- Destructive actions require an exact phrase and a pre-action snapshot.

## Main modules

- `src/router.js`: HTTP API and authentication boundary.
- `src/ai/gemini.js`: structured planning and API fallback.
- `src/planner/schema.js`: allowed action contract.
- `src/planner/safety.js`: independent policy enforcement.
- `src/planner/executor.js`: snapshots, sequential application, audit.
- `src/discord/service.js`: Discord object resolution and REST actions.
- `src/security.js`: password verifier and AES-GCM secret store.
- `public/`: first-run wizard, local chat, plan review, explorer, history.
