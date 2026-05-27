# Decision Threads

Decision threads connect a work item to a human decision.

They exist because some work cannot be completed by better execution. A human has to choose direction, accept risk, provide context, or reject the work.

## When To Create One

Create a decision thread when:

- multiple valid options exist
- the worker lacks authority to choose
- the choice changes scope, cost, security, privacy, or user-facing behavior
- the work cannot proceed without operator preference

Do not create a decision thread when the answer can be discovered by inspecting the repo, running a check, or verifying the live system.

## What It Should Include

A good decision thread includes:

- the work item being decided
- the decision needed
- the options
- the recommended option when one exists
- consequences of each option
- a place to store the resolution

## Current Status

Decision threads are optional in v1. The MCP schema should be able to store them without requiring any specific chat platform.
