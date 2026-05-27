# Project Tracks

Project tracks are the long-running containers for related work.

A track can represent a product, repo, workstream, operating program, source integration, migration, launch, or investigation theme. Work items can exist without a track, but major work should have one so progress and context do not disappear into individual tasks.

## What Tracks Store

A project track should capture:

- stable key and name
- summary and current status
- owner or operating role when known
- linked repos, docs, work items, candidates, and external references
- recent evidence and update candidates
- next action and known blockers

## How Tracks Differ From Work Items

A track is not usually executable by itself. It is the durable context around executable work.

For example, "Stabilize homelab backups" is a track. "Add backup health digest to the monitoring job" is a work item.

## Track Links

Track links connect a project to evidence. A link can point at a work item, project candidate, repo, document, chat thread, external issue, or note.

These links let a digest explain why the project is in its current state without forcing the reader to search across tools.

## Current Status

Project tracks are planned for `@clearance/schema` and `@clearance/mcp`. The source PMO system already uses this pattern; Clearance will extract the generic version.
