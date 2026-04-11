# Contexts and auth refactor

## Goal

Introduce named environment "contexts" (like `kubectl` / `aws` profiles) so users can keep a prod login and a staging login side-by-side, switch between them, and run commands against any of them. Along the way, fix the existing `auth.ts` misuse of `Bun.secrets` (which today stores configuration like `base-url` alongside credentials, violating the Bun docs' explicit "credentials-only" guidance) and add interactive password prompting via `@inquirer/prompts`.

This is one cohesive unit of work: the context system, the auth refactor, and the password prompt all share a single data model and a single storage layer. Doing them together is cheaper than doing them serially.

## Data model

A single secret is stored at `{service: "appmixer-adm", name: "config"}`. Its value is a JSON blob:

```ts
interface Config {
  activeContext: string | null;
  contexts: Record<string, Context>;
}

interface Context {
  baseUrl: string;
  username: string;
  token?: string;      // set after successful login
  tokenExp?: number;   // seconds-since-epoch, parsed from the JWT on login
}
```

- One `Bun.secrets.get({service: "appmixer-adm", name: "config"})` returns the whole state.
- One `Bun.secrets.set({service: "appmixer-adm", name: "config"}, JSON.stringify(config))` writes it back.
- Context names are free-form non-empty strings.
- `activeContext` is `null` on a fresh install, and also when the active context has been deleted without a replacement.
- A context without a `token` is valid — it means the user has set the context but not yet logged in.

The user explicitly chose to put the full config (not just credentials) inside `Bun.secrets`, overriding the Bun docs' "credentials-only" guidance. The design is internally consistent with that choice: one secret, one read, one write.

## Commands

```
appmixer-adm login [--context <name>] [--base-url <url>] [--username <user>] [--password <pwd>]
appmixer-adm context set <name> --base-url <url> --username <user>
appmixer-adm context use <name>
appmixer-adm context list
appmixer-adm context current
appmixer-adm context delete <name> [--yes]
```

### `login`

Password resolution order: `--password` flag → `APPMIXER_PASSWORD` env var → interactive prompt via `@inquirer/prompts`. In a non-TTY shell with no password source, error out with a message pointing at the flag and env var.

Context resolution:

1. `--context <name>` with an existing context → use its `baseUrl`/`username`, prompt for password if not provided. `--base-url` and `--username` flags are ignored in this case (use `context set` to update an existing context).
2. `--context <name>` with a **new** name plus `--base-url` and `--username` → create the context, then authenticate.
3. No `--context` → use `activeContext`. If there's no active context and flags are missing, error out and point at `context set` or `login --context <new>`.

On success, `login` writes the token and its `tokenExp` back into the context. If `activeContext` was `null`, it's set to the context that just logged in.

### `context set <name>`

Create or update a context. Requires `--base-url` and `--username`. Never touches `token`/`tokenExp` directly — but if the name already exists and `username` changes, the existing token is cleared (it belongs to the old username) and a warning is printed. Does not change `activeContext`.

### `context use <name>`

Sets `activeContext` to `<name>`. Errors if the name doesn't exist, listing available contexts.

### `context list`

Prints a table: `NAME | BASE URL | USERNAME | LOGGED IN`, with a `*` next to the active one. `LOGGED IN` is:
- `yes` — context has a non-expired token
- `expired` — context has a token but `tokenExp` is in the past
- `no` — context has no token

### `context current`

Prints the active context name to stdout. Exits 1 with a message if `activeContext` is `null`.

### `context delete <name> [--yes]`

Removes the context. Prompts `Delete context '<name>'? [y/N]` unless `--yes` is passed. In a non-TTY shell without `--yes`, refuses to run (same pattern as `flows apply`). If the deleted context was active, `activeContext` becomes `null` and a warning is printed.

## Override hierarchy for downstream commands

Existing commands (`flows`, `provision`, `config`, `acl`, `service-config`) call `getSession()` today. After this change, `getSession()` becomes a thin wrapper around `resolveContext()` with the following precedence:

1. `CLI_TEST_MODE=true` → read from `APPMIXER_TOKEN` + `APPMIXER_BASE_URL` env vars. Keychain never touched. (Unchanged — preserves all existing test behavior.)
2. `APPMIXER_CONTEXT=<name>` env var → that context from the config blob.
3. `activeContext` from the config blob.

Adding a `--context` flag to every downstream command is **out of scope** for this spec — the env var and active-context mechanisms are enough for now. A follow-up can add per-command flag plumbing if it's needed.

## Module structure

```
src/
  auth.ts              — rewritten: thin login() + getSession() using config.ts
  config.ts            — NEW: loadConfig(), saveConfig(), resolveContext()
  prompts.ts           — NEW: promptPassword() wrapper around @inquirer/prompts
  commands/
    context/
      index.ts         — registerContext()
      set.ts
      use.ts
      list.ts
      current.ts
      delete.ts
```

### `config.ts`

Owns every `Bun.secrets` call. Exports:

- `loadConfig(): Promise<Config>` — reads the single blob. Returns `{activeContext: null, contexts: {}}` if the secret is missing. Throws a clear error on corrupt JSON.
- `saveConfig(config: Config): Promise<void>` — serializes and stores.
- `resolveContext(opts?: {context?: string}): Promise<{name: string; ctx: Context}>` — applies the override hierarchy. Throws with an actionable "no context set" message if nothing resolves.

In-memory test mode: when `CLI_TEST_MODE=true`, `loadConfig`/`saveConfig` operate on a module-level object instead of `Bun.secrets`. Exported `resetTestConfig()` resets the object between tests.

### `auth.ts` (rewritten)

Shrinks dramatically. `login(opts)` orchestrates: resolves the context (or creates it), resolves the password (flag/env/prompt), calls `/user/auth`, parses the JWT for `exp`, writes the context back via `saveConfig`, and sets `activeContext` if it was `null`. `getSession()` becomes a ~5-line wrapper around `resolveContext` that validates `tokenExp`. All direct `Bun.secrets` calls move to `config.ts`.

`decodeJwt` stays in `auth.ts` as-is.

### `prompts.ts`

Single-function module: `promptPassword(message: string): Promise<string>`. Wraps `@inquirer/prompts`. When `CLI_TEST_MODE=true`, reads from `APPMIXER_TEST_PASSWORD` env var instead of calling the real prompt.

## Error handling and edge cases

- **No config yet** — `loadConfig` returns the empty default. Commands that need a context error clearly.
- **`login` with no context resolvable and no flags** — error: `No active context. Run 'appmixer-adm login --context <name> --base-url <url> --username <user>' to create one.`
- **`login --context foo` where `foo` is new and `--base-url`/`--username` missing** — error: `Context 'foo' does not exist. Pass --base-url and --username to create it.`
- **`context use foo` where `foo` is missing** — error lists available context names.
- **`context delete foo` where `foo` is missing** — error, exit 1.
- **`context delete` on the active context** — allowed. `activeContext` becomes `null`. Warning: `Deleted active context. Run 'context use <name>' to pick a new one.`
- **`context set` on an existing context with a different username** — updates `baseUrl`/`username`, clears the old `token`/`tokenExp`, prints a warning that a re-login is needed.
- **Corrupt config blob** — `loadConfig` wraps the `JSON.parse` error: `Config is corrupt. Run 'login' to reset it.` No auto-repair.
- **Token expired during a downstream command** — same message as today: `Session expired. Run 'appmixer-adm login' first.` Expiry check uses `tokenExp` from the blob; no JWT decode on every request.
- **Non-TTY `login` without password source** — error: `No password provided. Use --password, APPMIXER_PASSWORD, or run in an interactive shell.`
- **Non-TTY `context delete` without `--yes`** — error: `Refusing to delete context in a non-interactive shell without --yes.`

## Migration from the current keychain layout

None. The old keys (`base-url`, `token:${baseUrl}`, `username:${baseUrl}` under service `appmixer-adm`) are ignored. This is a POC repo with very few installs; requiring a re-login is acceptable. Stale old entries remain in the keychain until manually cleared — not worth the code to auto-clean.

## Testing

`Bun.secrets` and `@inquirer/prompts` are both bypassed in test mode so `bun test` never touches the real keychain or real stdin.

### New test files

- `test/config.test.ts` — unit tests for `loadConfig`, `saveConfig`, and `resolveContext`:
  - fresh install returns the empty default
  - round-trip: save, load, equal
  - `resolveContext({context: "name"})` returns the named context
  - `APPMIXER_CONTEXT` env var wins over active context
  - `--context` opt wins over env var
  - falls back to `activeContext`
  - throws when no context is resolvable
  - throws when requested context is missing
- `test/e2e/context.test.ts` — end-to-end coverage of every `context` subcommand:
  - `context set` creates and updates (with username-change warning)
  - `context use` switches; errors on missing
  - `context current` prints; errors when none active
  - `context list` shows the table with `*` on the active row and correct `LOGGED IN` state
  - `context delete` with `--yes` succeeds; on active context, clears `activeContext` with warning
  - `context delete` in non-TTY without `--yes` refuses

### Modified test files

- `test/auth.test.ts` — extend with tests for the refactored `login()`:
  - password from `--password` flag
  - password from `APPMIXER_PASSWORD` env var
  - password from `APPMIXER_TEST_PASSWORD` (simulates interactive prompt)
  - token and `tokenExp` written back into the context
  - `activeContext` auto-set on first successful login
  - `login --context new --base-url X --username Y` creates the context and authenticates
  - `login --context foo` with missing flags errors clearly
- `test/e2e/login.test.ts` — extend to cover the new login-with-context flows and confirm downstream commands (e.g., `config get-all`) pick up the active context correctly.
- `test/mock-server.ts` — no changes needed; the HTTP surface is unchanged.

### Manual smoke test (not in CI)

Once: `login` against a real Appmixer instance, `context list` (shows `yes`), close the shell, reopen, `context current` (still remembered), run a `flows import` (still authenticated). This confirms the real-keychain round-trip works end-to-end.

## Out of scope

- A `--context` flag on every downstream command. Use `APPMIXER_CONTEXT` env var or switch the active context instead. Per-command flag plumbing is a follow-up if needed.
- Automatic migration from the old keychain layout. POC repo; re-login is acceptable.
- Password length validation, username validation, URL validation. The server rejects bad values at login time.
- Multi-user password storage. Each context has exactly one `username`/`token` pair.
- Encrypted export/import of contexts. If you need the same contexts on a second machine, re-run `context set` + `login` there.
