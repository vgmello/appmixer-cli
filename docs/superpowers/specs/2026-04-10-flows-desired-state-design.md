# Flows desired-state configuration

## Goal

Manage Appmixer flows as a set of local JSON files. A folder of `*.json` files is the source of truth for which flows should exist on the server and what they should contain. Running `flows apply <folder>` reconciles the server to match the folder. Running `flows import <flowId> --output <file>` pulls a single flow from the server into a local file so the user can refresh their working copy after editing through the Appmixer UI.

This sits alongside the existing `provision` command group, not inside it. Flows are large enough and change often enough that mixing them with config/service-config/ACL provisioning would be awkward.

## Commands

```
appmixer-adm flows apply <directory> [--prune] [--force] [--yes]
appmixer-adm flows import <flowId> --output <file>
```

### `flows apply <directory>`

1. Walk `*.json` files in `<directory>` (non-recursive — flat folder).
2. Read each file as JSON. Files with a `flowId` field are candidate updates; files without are candidate creates.
3. Fetch `GET /flows` to build the remote set.
4. Compute a plan with four buckets:
   - **create** — local file with no `flowId`, OR local file whose `flowId` does not exist on the server (stale ID — replaced on create).
   - **update** — local `flowId` exists remotely and normalized content differs.
   - **skip** — local `flowId` exists remotely and normalized content matches.
   - **prune** — remote flow with no matching local file. Only included when `--prune` is passed.
5. Print the plan as a table and prompt `Apply these changes? [y/N]`. `--yes` skips the prompt. If stdin is not a TTY and `--yes` was not passed, refuse to run.
6. If the plan is empty, print `No changes.` and exit 0 without prompting.
7. Execute each operation independently. A failure on one does not abort the rest. Exit non-zero if any failed.

Operation semantics:

- **Create** — `POST /flows` with the local file content. On success, write the server-assigned `flowId` back into the local file. If writeback fails (disk full, permissions), that is a hard error: the flow now exists remotely but the local ID is lost, and the user must be notified immediately.
- **Update** — Before writing, fetch `GET /flows/:id` and copy `userId` and `sharedWith` from the remote response onto the local body. Then `PUT /flows/:id` with the merged body. If the remote flow's `stage` is `running`, the operation fails with a clear "blocked: running" message unless `--force` was passed, in which case `forceUpdate=true` is included on the PUT.
- **Prune** — `DELETE /flows/:id`. Only runs when `--prune` was passed.

### `flows import <flowId> --output <file>`

`GET /flows/:flowId`, write the raw response to `<file>` pretty-printed with 2-space indentation. Overwrites if the file exists. No folder-walk mode — refreshing multiple flows is something the user scripts themselves.

## File format

Each flow lives in its own `*.json` file. The file content is the raw `GET /flows/:id` response, exactly as the server returns it, pretty-printed with 2-space indentation. No wrapper, no metadata sidecar, no kebab-case transform.

The filename is cosmetic. Identity comes from the `flowId` field inside the file. A new flow authored by hand will not have a `flowId`; after the first successful `apply`, the CLI rewrites the file in place to include the server-assigned ID.

Folder layout is flat: one directory, one file per flow, no subdirectories.

## Diff and field handling

The raw API response contains server-managed fields that change on every fetch and would create constant spurious diffs. The diff module classifies fields into three groups:

- **Stripped from both sides for diffing, and stripped from the PUT body** — purely volatile/server-generated. Currently: `mtime`, `btime`.
- **Stripped from diff, preserved on PUT** — `userId`, `sharedWith`. Diff ignores them so editing them locally has no effect; on update they are taken from the current remote response and merged onto the local body. The user can never accidentally change ownership or sharing through `apply`.
- **Stripped from diff, not sent on PUT** — `stage`. Not part of desired state. The CLI never starts or stops flows. Users manage `stage` through the Appmixer UI.

The lists are constants in `diff.ts`, easy to extend as we discover other noisy fields during implementation.

## Code structure

New files mirror the existing `provision/` layout:

```
src/commands/flows/
  index.ts      — registers `flows` command group
  apply.ts      — `flows apply` command + execute logic
  import.ts     — `flows import` command
  diff.ts       — strip-field constants, normalize(), computePlan()
```

`src/index.ts` gets one new line to register the `flows` group alongside `provision`.

`diff.ts` exports:

- `STRIP_FOR_DIFF` — array of field names ignored when comparing local vs remote.
- `PRESERVE_FROM_REMOTE` — `["userId", "sharedWith"]`. Used by apply to merge remote values onto the local body before PUT.
- `normalize(flow)` — returns a copy with `STRIP_FOR_DIFF` fields removed.
- `computePlan(localFiles, remoteFlows, { prune })` — pure function returning `{ creates, updates, skips, prunes }`.

`apply.ts` is responsible for I/O: file walking, prompting, calling the client, writeback, and the per-operation result reporting (using `ora` to match the existing provision commands).

## Error handling and edge cases

- **Stale local `flowId`** (file references an ID the server no longer has) — treat as create. Strip the stale ID, POST, write the new one back. Logged in the plan as `create (stale id replaced)`.
- **Two local files with the same `flowId`** — hard error before the plan runs. The folder is corrupt; refuse to do anything.
- **Invalid JSON in any file** — hard error, name the file, exit non-zero. No partial apply.
- **Update of a running flow without `--force`** — plan shows `update (blocked: running)`. After confirmation, those entries fail individually with a clear message; other operations proceed. Exit code is non-zero.
- **Empty plan** — print `No changes.` and exit 0 without prompting.
- **Non-TTY without `--yes`** — refuse to run. Prevents accidental hangs in CI.
- **Partial failure during execute** — independent per operation. Final summary lists successes and failures; exit code reflects whether any failed (matches `provision apply` behavior).
- **Writeback failure after create** — hard error. The flow exists remotely but the local ID was not persisted; user must be told immediately.

## Testing

Following the existing `test/` layout:

- `test/flows-diff.test.ts` — unit tests for `normalize` and `computePlan` covering: new file (no flowId) → create, matching content → skip, differing content → update, remote-only flow with `prune: false` → ignored, remote-only flow with `prune: true` → prune, local file with flowId not in remote → create with stale-id annotation, two local files with same flowId → error.
- `test/flows-apply.test.ts` — integration test against `mock-server.ts` exercising the full create/update/skip/prune flow including writeback of `flowId` to a new file and the merge of `sharedWith` from remote on update. Also covers the `--force` path for running flows and the non-TTY guard.
- `test/flows-import.test.ts` — integration test that calls `flows import <id> --output <path>` and asserts the output file matches what the mock server returned.

`test/mock-server.ts` gains routes for `GET /flows`, `GET /flows/:id`, `POST /flows`, `PUT /flows/:id`, `DELETE /flows/:id`.

## Out of scope

- Reconciling `stage` (start/stop). Explicitly excluded per design discussion.
- A separate `flows start` / `flows stop` command. May be added later; not part of this work.
- Folder-walk refresh mode for `import`. Single-flow only.
- Subdirectories within the flows folder.
- Diffing logic configurable via flags. The strip lists are code constants.
