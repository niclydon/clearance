# Run Packs

Run packs are scoped execution lists.

A run pack says: work on this set of items in this order or under this theme. It does not say every item is safe to execute.

## The Key Rule

A run pack is a scoping instruction, not a safety grant.

If an item in a run pack lacks the right execution tag, the worker should skip or record it as not eligible rather than treating run-pack membership as approval.

## What Run Packs Are For

Run packs are useful for:

- draining a specific project tranche
- batching related documentation work
- working through a bug-fix marathon
- giving an agent a bounded queue
- recording per-item outcomes after a session

## Item Disposition

Each item in a run pack should end with a disposition such as:

- shipped
- blocked
- skipped not eligible
- failed
- already complete

## Current Status

Run pack tables and tools are planned. The source PMO uses run packs to scope large batches without weakening governance tags.
