# appmixer-adm

A command-line tool for managing an [Appmixer](https://appmixer.com) instance via its REST API. Configure settings, manage access control lists, update service configs, and provision entire instances from YAML files.

## Prerequisites

- [Bun](https://bun.sh) v1.3.8 or later

## Install

```bash
bun install
```

## Usage

### Via bun script

```bash
bun cli --help
bun cli <command> [options]
```

### Via direct execution

```bash
bun src/index.ts --help
bun src/index.ts <command> [options]
```

### Via compiled binary

Build a standalone binary:

```bash
bun build src/index.ts --compile --outfile appmixer-adm
```

Then use it directly:

```bash
./appmixer-adm --help
./appmixer-adm <command> [options]
```

To install it globally, move the binary to a directory in your PATH:

```bash
sudo mv appmixer-adm /usr/local/bin/
appmixer-adm --help
```

## Authentication

The CLI manages one or more named "contexts". Each context has a `baseUrl`, `username`, and (after login) a token. Contexts are stored in the OS keychain via `Bun.secrets`.

Create a new context and log in:

```bash
appmixer-adm login --context prod --base-url https://api.example.com --username admin
```

If `--password` is not given, the CLI reads `APPMIXER_PASSWORD` from the environment; if neither is set, it prompts interactively.

Subsequent logins on the same context only need `--context <name>` and the password (via flag, env var, or prompt):

```bash
appmixer-adm login --context prod
```

Omitting `--context` uses the active context (whatever `appmixer-adm context current` prints).

### Environment variables

| Flag | Environment variable |
|------|---------------------|
| `--base-url <url>` | `APPMIXER_BASE_URL` (used only when creating a new context) |
| `--username <username>` | `APPMIXER_USERNAME` (used only when creating a new context) |
| `--password <password>` | `APPMIXER_PASSWORD` |

The env var `APPMIXER_CONTEXT` overrides the active context for a single command without changing which context is active.

### `context` commands

```bash
appmixer-adm context set <name> --base-url <url> --username <user>   # create/update
appmixer-adm context use <name>                                       # switch active
appmixer-adm context list                                             # list all
appmixer-adm context current                                          # print active
appmixer-adm context delete <name> [--yes]                            # remove
```

`context list` prints a table showing each context's base URL, username, and login status (`yes` / `expired` / `no`). The active context is marked with `*`.

`context delete` prompts for confirmation unless `--yes` is passed; it refuses to run in a non-interactive shell without `--yes`.

## Commands

### `config get-all`

List all configuration key/value pairs.

```bash
appmixer-adm config get-all
```

### `service-config get-all`

List all connector service configurations.

```bash
appmixer-adm service-config get-all [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `--pattern <pattern>` | Filter by service ID pattern | — |
| `--sort <sort>` | Sort by field (e.g. `serviceId:1`) | — |
| `--offset <offset>` | Pagination start index | `0` |
| `--limit <limit>` | Max items returned | `100` |

### `service-config get`

Get a single service configuration.

```bash
appmixer-adm service-config get <serviceId>
```

### `acl types get`

List all ACL types.

```bash
appmixer-adm acl types get
```

### `acl resources get`

List available resources for an ACL type.

```bash
appmixer-adm acl resources get <type>
```

### `acl actions get`

List available actions for an ACL type.

```bash
appmixer-adm acl actions get <type>
```

### `acl attributes get`

List attributes for an ACL type and resource.

```bash
appmixer-adm acl attributes get <type> <resource>
```

### `acl rules get`

List ACL rules for a type.

```bash
appmixer-adm acl rules get <type>
```

### `provision apply`

Apply provisioning YAML files to the server. Reads all `*.yaml`/`*.yml` files from the given directory and creates config entries, service configs, and ACL rules.

```bash
appmixer-adm provision apply <directory>
```

### `provision import`

Export the current server state as YAML provisioning files. Writes `config.yaml`, `service-config.yaml`, and `acl.yaml` to the given directory.

```bash
appmixer-adm provision import <directory>
```

### `flows apply`

Reconcile a folder of flow JSON files against the server. Each `*.json` file in the folder describes one flow; the file's `flowId` field identifies it remotely. Files without a `flowId` are created on first apply and the assigned ID is written back to disk.

```bash
appmixer-adm flows apply <directory> [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `--prune` | Delete remote flows that have no local file | off |
| `--force` | Allow updating flows whose `stage` is `running` | off |
| `--yes` | Skip the confirmation prompt | off |

The command prints a plan (creates, updates, prunes, skips) and prompts for confirmation. In a non-interactive shell `--yes` is required. The fields `mtime`, `btime`, `stage`, `userId`, and `sharedWith` are ignored when diffing; `userId` and `sharedWith` are always taken from the server on update so ownership and sharing cannot be changed through `apply`.

### `flows import`

Fetch a single flow from the server and write it to a JSON file. Use this to refresh a local copy after editing through the Appmixer UI.

```bash
appmixer-adm flows import <flowId> --output <file>
```

## Provisioning file format

YAML files use kebab-case keys. The CLI converts them to camelCase before sending to the API (and vice versa on import). A provisioning directory can contain any combination of these top-level keys across one or more files:

```yaml
config:
  - key: some-setting
    value: true

service-config:
  - service-id: "appmixer:google"
    client-id: "..."
    client-secret: "..."

acl:
  components:
    - resource: "appmixer:utils"
      action: use
      attribute: allow
  routes:
    - resource: "/my-route"
      action: get
      attribute: allow
```

## Running tests

```bash
bun test
```

## License

Private
