# MCP Surface

The MCP server is the primary automation interface for Clearance.

MCP matters because it lets AI coding agents and local tools interact with the PMO system through structured tools instead of ad hoc prompts.

## Core Tool Families

The planned core tools cover:

- work intake and candidate creation
- work and project listing
- claim next eligible work
- claim heartbeat
- block with child work
- close with evidence
- run pack creation and disposition recording
- operational digest reads

## Tool Design Rules

Every tool should have:

- strict input schema
- bounded output
- redaction for secret-shaped values
- clear error messages
- stable JSON result shape
- explicit read-only or write behavior
- documented authorization expectation

## MCP Is Not The Whole Product

Clearance should still make sense to a human operator who never thinks about MCP. MCP is the tool surface, not the product identity.

The product identity is the PMO/work-management system.

## Current Status

The MCP server is planned but not implemented.
