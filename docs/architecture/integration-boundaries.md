# Integration Boundaries

Clearance should be easy to integrate without becoming tangled in the host system.

## What Clearance Owns

Clearance owns:

- PMO schema
- work and project state
- candidate review state
- governance tags
- claims and leases
- run packs
- decision records
- evidence requirements
- role contracts
- tool interfaces for PMO operations

## What Host Systems Own

Host systems own:

- domain-specific data
- deploy commands
- secret storage
- app-specific permissions
- repo layout
- CI/CD systems
- chat platform credentials
- custom dashboards
- LLM provider choice

## Integration Rule

Clearance should store references and evidence, not absorb every host-system detail.

For example, Clearance can link to a deploy run and require deploy evidence. It should not assume one universal deploy wrapper works for every user.

## Current Status

These boundaries are design commitments for the first implementation phase.
