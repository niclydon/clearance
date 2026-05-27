# Governance Tags

Governance tags are the control plane for Clearance.

Status says where work is in its lifecycle. Tags say who or what may act on it now.

## Core Tags

The planned v1 system tags are:

- `autonomous_safe`: approved for a worker or agent to execute without another human decision.
- `requires_decision`: a human must choose between real options.
- `requires_clickops`: a human must perform a manual action outside the system.
- `requires_investigation`: the premise is not clear enough to build.
- `requires_secret`: blocked on a credential or token.
- `blocked_on_dependency`: waiting on another work item or external dependency.
- `observation_gate`: waiting for time or a future event.
- `deferred`: deliberately parked.

## Permission Invariant

Workers and agents may remove execution permission when they discover a blocker. They must not grant themselves execution permission.

In practice, this means an agent can remove `autonomous_safe` from work that is no longer safe, but it cannot promote its own discovered work into `autonomous_safe`.

## Custom Tags

Clearance should allow custom tags, but the reserved governance tags need stable meanings across installations. The recommended approach is to keep system tags reserved and let users add custom tags in a documented namespace.

## Current Status

The tag vocabulary is planned seed data for the schema package. The exact extension rules will be finalized during schema implementation.
