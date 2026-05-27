# Releasing Clearance

The checklist for publishing Clearance — both flipping the GitHub repository to public and publishing the npm packages. None of these steps are automated; they are deliberate operator actions.

## 1. Pre-release verification

```bash
npm install
npm run build
npm run check        # format, lint, typecheck, tests, Markdown link check
```

Run the schema integration tests against a throwaway database:

```bash
createdb clearance_test
CLEARANCE_TEST_DATABASE_URL=postgres://localhost/clearance_test npm test
```

And the end-to-end example:

```bash
createdb clearance_demo
DATABASE_URL=postgres://localhost/clearance_demo node examples/dogfood/run.mjs
```

## 2. Public-safety hygiene

Before the repository is public, confirm there are no private references in tracked files:

```bash
git ls-files | xargs grep -rniE '/home/[a-z]+|secret[_-]?key|password|BEGIN [A-Z]+ PRIVATE KEY' 2>/dev/null
```

- Internal host names, internal project codenames, and absolute home paths must not appear (the documented origin "Nexus" is intentional and public).
- No `.env`, key, or credential files are tracked (`.gitignore` covers them).
- No stale claims or environment-specific config are committed.

## 3. Flip the GitHub repository to public

```bash
gh repo edit <owner>/clearance --visibility public --accept-visibility-change-consequences
```

This is irreversible in effect (the content becomes public and may be cached/forked). Do it only after the hygiene check passes.

## 4. Publish the npm packages (optional, when ready)

Package publishing is separate from making the repo public. When publishing:

1. In each package's `package.json`, set `"private": false` and add `"publishConfig": { "access": "public" }`.
2. Set the real version (start at `0.1.0`) across the packages.
3. Dry-run, then publish in dependency order (`@clearance/schema`, then `@clearance/mcp`, then `@clearance/contracts`):

```bash
npm publish --workspace @clearance/schema --dry-run
npm publish --workspace @clearance/schema --access public
# repeat for @clearance/mcp and @clearance/contracts
```

## 5. Tag the release

```bash
git tag v0.1.0
git push --tags
```

Update [CHANGES.md](../../CHANGES.md) with the release summary.
