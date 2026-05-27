# Evidence Requirements Reference

Verified close requires evidence or explicit not-applicable notes.

## Required Evidence Areas

| Area | Required when |
| --- | --- |
| Tests, build, or lint | Code changed. |
| Smoke check | Runtime behavior changed. |
| Deploy verification | A deploy happened or was required. |
| Docs or changelog | Behavior, operations, or public usage changed. |
| Migration verification | Schema changed. |
| No-code proof | The item closed without file or runtime changes. |

## Evidence Shape

Evidence should be concrete. Prefer command names, result summaries, links to runs, timestamps, migration ids, and paths to updated docs.

Avoid vague statements such as "looks good" or "done".

## Current Status

The evidence model is planned. The MCP server should enforce the final shape in `close_verified`.
