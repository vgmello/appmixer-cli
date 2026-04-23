# terraform-provider-appmixer — Plan 01: Foundation + `appmixer_config`

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap a new `terraform-provider-appmixer` repo with a working HTTP client, provider authentication, and the first resource (`appmixer_config`) fully implemented and tested end-to-end.

**Architecture:** Go module using HashiCorp's terraform-plugin-framework. Thin hand-written HTTP client mirrors `appmixer-cli/src/client.ts`. Mock-server copied from `appmixer-cli/test/mock-server.ts` and invoked as a subprocess by acceptance tests. `appmixer_config` proves the full vertical (provider config → auth → CRUD → import) before any further resources are added in follow-up plans.

**Tech Stack:** Go 1.22+, `terraform-plugin-framework`, `terraform-plugin-testing`, `tfplugindocs`, `httptest` for unit tests, Bun (for running the copied TS mock-server from Go test harness).

**Spec:** `docs/superpowers/specs/2026-04-23-terraform-provider-appmixer-design.md`

**Working directory convention:** The new provider repo is created as a *sibling* of `appmixer-cli`:
- Spec/plan repo: `/Users/vgmello-dev/repos/projects/appmixer-cli/`
- Provider repo: `/Users/vgmello-dev/repos/projects/terraform-provider-appmixer/` (created in Task 1)

**Module path placeholder:** Tasks use `github.com/ellosoft/terraform-provider-appmixer` throughout. If your org namespace differs, adjust in Task 2 *before* running `go mod tidy`.

---

## File Structure (created by this plan)

```
terraform-provider-appmixer/
├── main.go                                 # entrypoint, calls providerserver.Serve
├── go.mod
├── go.sum
├── README.md                               # dev_overrides setup instructions
├── .gitignore
├── examples/
│   └── resources/
│       └── appmixer_config/
│           └── resource.tf                 # feeds tfplugindocs
├── internal/
│   ├── provider/
│   │   ├── provider.go                     # schema, Configure, resource registry
│   │   └── provider_test.go                # provider schema validation
│   ├── client/
│   │   ├── client.go                       # HTTP methods (Get/Post/Put/Delete)
│   │   ├── client_test.go                  # httptest unit tests
│   │   ├── auth.go                         # POST /user/auth → token
│   │   ├── auth_test.go
│   │   └── errors.go                       # structured non-2xx error
│   ├── resource/
│   │   └── config.go                       # appmixer_config resource
│   └── acctest/
│       ├── helper.go                       # TestMain: spawn mock, set env
│       └── helper_test.go
└── mock-server/
    ├── server.ts                           # copied from appmixer-cli/test/mock-server.ts
    ├── package.json
    └── bun.lock                            # created by `bun install`
```

Each file has one clear responsibility. Resources never talk to HTTP directly — they go through `internal/client`. Acceptance tests never talk to a real server — they go through `internal/acctest` which spawns the mock.

---

## Task 1: Create the provider repo and initial scaffolding

**Files:**
- Create: `/Users/vgmello-dev/repos/projects/terraform-provider-appmixer/.gitignore`
- Create: `/Users/vgmello-dev/repos/projects/terraform-provider-appmixer/README.md` (stub)

- [ ] **Step 1: Create the directory and init git**

```bash
mkdir -p /Users/vgmello-dev/repos/projects/terraform-provider-appmixer
cd /Users/vgmello-dev/repos/projects/terraform-provider-appmixer
git init -b main
```

- [ ] **Step 2: Write `.gitignore`**

```gitignore
# Go
*.test
*.out
/terraform-provider-appmixer
/dist/

# Terraform
.terraform/
*.tfstate
*.tfstate.backup
.terraform.lock.hcl
crash.log

# Mock server
/mock-server/node_modules/

# IDE
.idea/
.vscode/
```

- [ ] **Step 3: Write `README.md` stub**

```markdown
# terraform-provider-appmixer

Terraform provider for managing an [Appmixer](https://appmixer.com) tenant.

**Status:** Early development. Public Registry publication not yet available — use via `dev_overrides` (instructions below).

## Development setup

See `docs/dev_overrides.md` after Task 17 of the foundation plan.
```

- [ ] **Step 4: Commit**

```bash
git add .gitignore README.md
git commit -m "chore: initial repo scaffolding"
```

Expected: commit created on `main`.

---

## Task 2: Initialize Go module and install framework dependencies

**Files:**
- Create: `go.mod`
- Create: `go.sum`

- [ ] **Step 1: Confirm Go version**

Run: `go version`
Expected: `go version go1.22.x` or later. If not installed, install Go 1.22+ first.

- [ ] **Step 2: Pick the module path and init**

**Important:** If your org namespace differs from `ellosoft`, replace it here — changing it later means editing every import in the repo.

```bash
cd /Users/vgmello-dev/repos/projects/terraform-provider-appmixer
go mod init github.com/ellosoft/terraform-provider-appmixer
```

- [ ] **Step 3: Add framework dependencies**

```bash
go get github.com/hashicorp/terraform-plugin-framework@latest
go get github.com/hashicorp/terraform-plugin-testing@latest
go get github.com/hashicorp/terraform-plugin-log@latest
go mod tidy
```

Expected: `go.mod` lists the three packages; `go.sum` is populated.

- [ ] **Step 4: Commit**

```bash
git add go.mod go.sum
git commit -m "chore: init go module and add plugin framework deps"
```

---

## Task 3: Write the provider entrypoint and minimal provider type

**Files:**
- Create: `main.go`
- Create: `internal/provider/provider.go`

- [ ] **Step 1: Write `main.go`**

```go
package main

import (
	"context"
	"flag"
	"log"

	"github.com/hashicorp/terraform-plugin-framework/providerserver"

	"github.com/ellosoft/terraform-provider-appmixer/internal/provider"
)

func main() {
	var debug bool
	flag.BoolVar(&debug, "debug", false, "Run with support for attaching a debugger")
	flag.Parse()

	err := providerserver.Serve(context.Background(), provider.New(), providerserver.ServeOpts{
		Address: "registry.terraform.io/ellosoft/appmixer",
		Debug:   debug,
	})
	if err != nil {
		log.Fatal(err.Error())
	}
}
```

- [ ] **Step 2: Write `internal/provider/provider.go` (stub with no resources)**

```go
package provider

import (
	"context"

	"github.com/hashicorp/terraform-plugin-framework/datasource"
	"github.com/hashicorp/terraform-plugin-framework/provider"
	"github.com/hashicorp/terraform-plugin-framework/provider/schema"
	"github.com/hashicorp/terraform-plugin-framework/resource"
)

type appmixerProvider struct{}

func New() func() provider.Provider {
	return func() provider.Provider { return &appmixerProvider{} }
}

func (p *appmixerProvider) Metadata(_ context.Context, _ provider.MetadataRequest, resp *provider.MetadataResponse) {
	resp.TypeName = "appmixer"
	resp.Version = "0.0.1"
}

func (p *appmixerProvider) Schema(_ context.Context, _ provider.SchemaRequest, resp *provider.SchemaResponse) {
	resp.Schema = schema.Schema{Attributes: map[string]schema.Attribute{}}
}

func (p *appmixerProvider) Configure(_ context.Context, _ provider.ConfigureRequest, _ *provider.ConfigureResponse) {
}

func (p *appmixerProvider) Resources(_ context.Context) []func() resource.Resource {
	return []func() resource.Resource{}
}

func (p *appmixerProvider) DataSources(_ context.Context) []func() datasource.DataSource {
	return []func() datasource.DataSource{}
}
```

- [ ] **Step 3: Verify it compiles**

Run: `go build ./...`
Expected: no errors, produces `terraform-provider-appmixer` binary.

- [ ] **Step 4: Commit**

```bash
git add main.go internal/provider/provider.go
git commit -m "feat: add provider entrypoint and minimal provider skeleton"
```

---

## Task 4: Implement the HTTP client — TDD the `Get` method

**Files:**
- Create: `internal/client/client.go`
- Create: `internal/client/client_test.go`

- [ ] **Step 1: Write the failing test**

Create `internal/client/client_test.go`:

```go
package client

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGet_DecodesJSONResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/config" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		if got := r.Header.Get("Authorization"); got != "Bearer tkn" {
			t.Errorf("expected auth header 'Bearer tkn', got %q", got)
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode([]map[string]any{{"key": "k1", "value": "v1"}})
	}))
	defer server.Close()

	c := &Client{BaseURL: server.URL, Token: "tkn", HTTP: server.Client()}

	got, err := Get[[]map[string]any](context.Background(), c, "/config")
	if err != nil {
		t.Fatalf("Get returned error: %v", err)
	}
	if len(got) != 1 || got[0]["key"] != "k1" {
		t.Fatalf("unexpected response: %+v", got)
	}
}
```

- [ ] **Step 2: Run the test, expect failure**

Run: `go test ./internal/client/ -run TestGet -v`
Expected: FAIL — `Client` and `Get` undefined.

- [ ] **Step 3: Write `client.go` to make it pass**

Create `internal/client/client.go`:

```go
package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type Client struct {
	BaseURL string
	Token   string
	HTTP    *http.Client
}

func New(baseURL string) *Client {
	return &Client{BaseURL: baseURL, HTTP: http.DefaultClient}
}

func (c *Client) do(ctx context.Context, method, path string, body any) (*http.Response, error) {
	var buf io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("encode body: %w", err)
		}
		buf = bytes.NewReader(b)
	}
	req, err := http.NewRequestWithContext(ctx, method, c.BaseURL+path, buf)
	if err != nil {
		return nil, err
	}
	if c.Token != "" {
		req.Header.Set("Authorization", "Bearer "+c.Token)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	return c.HTTP.Do(req)
}

func Get[T any](ctx context.Context, c *Client, path string) (T, error) {
	var zero T
	resp, err := c.do(ctx, http.MethodGet, path, nil)
	if err != nil {
		return zero, err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return zero, fmt.Errorf("GET %s: status %d: %s", path, resp.StatusCode, string(body))
	}
	var out T
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return zero, fmt.Errorf("decode GET %s: %w", path, err)
	}
	return out, nil
}
```

- [ ] **Step 4: Run the test, expect pass**

Run: `go test ./internal/client/ -run TestGet -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/client/client.go internal/client/client_test.go
git commit -m "feat: add HTTP client Get method"
```

---

## Task 5: Add `Post`, `Put`, `Delete` methods with tests

**Files:**
- Modify: `internal/client/client.go`
- Modify: `internal/client/client_test.go`

- [ ] **Step 1: Append failing tests for Post/Put/Delete**

Append to `internal/client/client_test.go`:

```go
func TestPost_SendsBodyAndDecodes(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("expected POST, got %s", r.Method)
		}
		var body map[string]any
		_ = json.NewDecoder(r.Body).Decode(&body)
		if body["key"] != "k1" {
			t.Errorf("expected body key=k1, got %v", body)
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(body)
	}))
	defer server.Close()

	c := &Client{BaseURL: server.URL, HTTP: server.Client()}
	got, err := Post[map[string]any](context.Background(), c, "/config", map[string]any{"key": "k1", "value": "v1"})
	if err != nil {
		t.Fatalf("Post error: %v", err)
	}
	if got["key"] != "k1" {
		t.Fatalf("unexpected response: %v", got)
	}
}

func TestPut_SendsBody(t *testing.T) {
	var called bool
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		if r.Method != http.MethodPut {
			t.Errorf("expected PUT, got %s", r.Method)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	defer server.Close()

	c := &Client{BaseURL: server.URL, HTTP: server.Client()}
	_, err := Put[map[string]any](context.Background(), c, "/svc/1", map[string]any{"a": 1})
	if err != nil || !called {
		t.Fatalf("Put error=%v called=%v", err, called)
	}
}

func TestDelete_NoBody(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			t.Errorf("expected DELETE, got %s", r.Method)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	defer server.Close()

	c := &Client{BaseURL: server.URL, HTTP: server.Client()}
	_, err := Delete[map[string]any](context.Background(), c, "/config/k1")
	if err != nil {
		t.Fatalf("Delete error: %v", err)
	}
}
```

- [ ] **Step 2: Run, expect failures**

Run: `go test ./internal/client/ -v`
Expected: TestPost/TestPut/TestDelete FAIL with "undefined".

- [ ] **Step 3: Append Post/Put/Delete to `client.go`**

Add before the end of `internal/client/client.go`:

```go
func Post[T any](ctx context.Context, c *Client, path string, body any) (T, error) {
	return doJSON[T](ctx, c, http.MethodPost, path, body)
}

func Put[T any](ctx context.Context, c *Client, path string, body any) (T, error) {
	return doJSON[T](ctx, c, http.MethodPut, path, body)
}

func Delete[T any](ctx context.Context, c *Client, path string) (T, error) {
	return doJSON[T](ctx, c, http.MethodDelete, path, nil)
}

func doJSON[T any](ctx context.Context, c *Client, method, path string, body any) (T, error) {
	var zero T
	resp, err := c.do(ctx, method, path, body)
	if err != nil {
		return zero, err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return zero, fmt.Errorf("%s %s: status %d: %s", method, path, resp.StatusCode, string(b))
	}
	var out T
	if resp.ContentLength == 0 {
		return zero, nil
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return zero, fmt.Errorf("decode %s %s: %w", method, path, err)
	}
	return out, nil
}
```

Also refactor `Get` to share `doJSON`:

```go
func Get[T any](ctx context.Context, c *Client, path string) (T, error) {
	return doJSON[T](ctx, c, http.MethodGet, path, nil)
}
```

(Delete the old duplicated Get body.)

- [ ] **Step 4: Run, expect all tests pass**

Run: `go test ./internal/client/ -v`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/client/client.go internal/client/client_test.go
git commit -m "feat: add Post/Put/Delete client methods"
```

---

## Task 6: Structured errors from non-2xx responses

**Files:**
- Create: `internal/client/errors.go`
- Modify: `internal/client/client.go`
- Modify: `internal/client/client_test.go`

- [ ] **Step 1: Append failing test**

Append to `client_test.go`:

```go
func TestError_Non2xx(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(404)
		_, _ = w.Write([]byte(`{"error":"not found"}`))
	}))
	defer server.Close()

	c := &Client{BaseURL: server.URL, HTTP: server.Client()}
	_, err := Get[map[string]any](context.Background(), c, "/missing")
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
	var apiErr *APIError
	if !errors.As(err, &apiErr) {
		t.Fatalf("expected *APIError, got %T: %v", err, err)
	}
	if apiErr.StatusCode != 404 {
		t.Fatalf("expected status 404, got %d", apiErr.StatusCode)
	}
	if apiErr.Method != http.MethodGet || apiErr.Path != "/missing" {
		t.Fatalf("unexpected method/path: %s %s", apiErr.Method, apiErr.Path)
	}
}
```

Add `"errors"` to the test file's imports.

- [ ] **Step 2: Run, expect failure**

Run: `go test ./internal/client/ -run TestError -v`
Expected: FAIL — `APIError` undefined.

- [ ] **Step 3: Write `errors.go`**

```go
package client

import "fmt"

type APIError struct {
	Method     string
	Path       string
	StatusCode int
	Body       string
}

func (e *APIError) Error() string {
	return fmt.Sprintf("%s %s: status %d: %s", e.Method, e.Path, e.StatusCode, e.Body)
}
```

- [ ] **Step 4: Replace the non-2xx branch in `doJSON`**

In `client.go`, replace:

```go
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return zero, fmt.Errorf("%s %s: status %d: %s", method, path, resp.StatusCode, string(b))
	}
```

with:

```go
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return zero, &APIError{Method: method, Path: path, StatusCode: resp.StatusCode, Body: string(b)}
	}
```

- [ ] **Step 5: Run tests, expect pass**

Run: `go test ./internal/client/ -v`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/client/errors.go internal/client/client.go internal/client/client_test.go
git commit -m "feat: surface non-2xx responses as structured APIError"
```

---

## Task 7: Authentication — TDD `Login`

**Files:**
- Create: `internal/client/auth.go`
- Create: `internal/client/auth_test.go`

- [ ] **Step 1: Write failing test**

Create `internal/client/auth_test.go`:

```go
package client

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestLogin_ExchangesCredentialsForToken(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/user/auth" || r.Method != http.MethodPost {
			t.Errorf("unexpected %s %s", r.Method, r.URL.Path)
		}
		var body map[string]string
		_ = json.NewDecoder(r.Body).Decode(&body)
		if body["username"] != "u" || body["password"] != "p" {
			t.Errorf("unexpected creds: %v", body)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"user":{"id":"x"},"token":"returned-token"}`))
	}))
	defer server.Close()

	c := &Client{BaseURL: server.URL, HTTP: server.Client()}
	if err := c.Login(context.Background(), "u", "p"); err != nil {
		t.Fatalf("Login: %v", err)
	}
	if c.Token != "returned-token" {
		t.Fatalf("expected token on client, got %q", c.Token)
	}
}
```

- [ ] **Step 2: Run, expect failure**

Run: `go test ./internal/client/ -run TestLogin -v`
Expected: FAIL — `Login` undefined.

- [ ] **Step 3: Write `auth.go`**

```go
package client

import "context"

type loginResponse struct {
	Token string `json:"token"`
}

func (c *Client) Login(ctx context.Context, username, password string) error {
	body := map[string]string{"username": username, "password": password}
	resp, err := Post[loginResponse](ctx, c, "/user/auth", body)
	if err != nil {
		return err
	}
	c.Token = resp.Token
	return nil
}
```

- [ ] **Step 4: Run, expect pass**

Run: `go test ./internal/client/ -v`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/client/auth.go internal/client/auth_test.go
git commit -m "feat: add Login that exchanges creds for a bearer token"
```

---

## Task 8: Wire provider `Configure` to log in and expose client to resources

**Files:**
- Modify: `internal/provider/provider.go`

- [ ] **Step 1: Update provider `Schema`**

Replace the `Schema` method in `internal/provider/provider.go`:

```go
func (p *appmixerProvider) Schema(_ context.Context, _ provider.SchemaRequest, resp *provider.SchemaResponse) {
	resp.Schema = schema.Schema{
		Attributes: map[string]schema.Attribute{
			"base_url": schema.StringAttribute{
				Optional:    true,
				Description: "Appmixer API base URL. Falls back to APPMIXER_BASE_URL.",
			},
			"username": schema.StringAttribute{
				Optional:    true,
				Description: "Appmixer admin username. Falls back to APPMIXER_USERNAME.",
			},
			"password": schema.StringAttribute{
				Optional:    true,
				Sensitive:   true,
				Description: "Appmixer admin password. Falls back to APPMIXER_PASSWORD.",
			},
		},
	}
}
```

- [ ] **Step 2: Define the config struct**

Add to `provider.go` (above `Configure`):

```go
type providerConfig struct {
	BaseURL  types.String `tfsdk:"base_url"`
	Username types.String `tfsdk:"username"`
	Password types.String `tfsdk:"password"`
}
```

Add the import:

```go
"github.com/hashicorp/terraform-plugin-framework/types"
```

- [ ] **Step 3: Replace `Configure`**

```go
func (p *appmixerProvider) Configure(ctx context.Context, req provider.ConfigureRequest, resp *provider.ConfigureResponse) {
	var cfg providerConfig
	resp.Diagnostics.Append(req.Config.Get(ctx, &cfg)...)
	if resp.Diagnostics.HasError() {
		return
	}

	baseURL := firstNonEmpty(cfg.BaseURL.ValueString(), os.Getenv("APPMIXER_BASE_URL"))
	username := firstNonEmpty(cfg.Username.ValueString(), os.Getenv("APPMIXER_USERNAME"))
	password := firstNonEmpty(cfg.Password.ValueString(), os.Getenv("APPMIXER_PASSWORD"))

	if baseURL == "" || username == "" || password == "" {
		resp.Diagnostics.AddError(
			"Missing provider configuration",
			"base_url, username, and password must all be set (via HCL or APPMIXER_BASE_URL/APPMIXER_USERNAME/APPMIXER_PASSWORD env vars).",
		)
		return
	}

	c := client.New(baseURL)
	if err := c.Login(ctx, username, password); err != nil {
		resp.Diagnostics.AddError("Login failed", err.Error())
		return
	}

	resp.ResourceData = c
	resp.DataSourceData = c
}

func firstNonEmpty(a, b string) string {
	if a != "" {
		return a
	}
	return b
}
```

Add imports:

```go
"os"
"github.com/ellosoft/terraform-provider-appmixer/internal/client"
```

- [ ] **Step 4: Compile**

Run: `go build ./...`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add internal/provider/provider.go
git commit -m "feat: wire provider Configure to authenticate against the Appmixer API"
```

---

## Task 9: Copy the mock server from `appmixer-cli` and verify startup

**Files:**
- Create: `mock-server/server.ts` (copied)
- Create: `mock-server/package.json`

- [ ] **Step 1: Copy the mock server source**

```bash
cd /Users/vgmello-dev/repos/projects/terraform-provider-appmixer
mkdir -p mock-server
cp /Users/vgmello-dev/repos/projects/appmixer-cli/test/mock-server.ts mock-server/server.ts
```

- [ ] **Step 2: Create `mock-server/package.json`**

```json
{
  "name": "appmixer-provider-mock-server",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "bun run server.ts"
  }
}
```

- [ ] **Step 3: Install (creates `bun.lock`)**

```bash
cd mock-server && bun install && cd ..
```

Expected: `bun install` exits successfully. The source file is self-contained (no cross-repo imports), so `node_modules` stays tiny — only `@types/bun` if it references it.

- [ ] **Step 4: Patch the standalone block to read `PORT` from env**

The copied file hard-codes port `3000` in its `import.meta.main` block. Acceptance tests need a free port each run. In `mock-server/server.ts`, find:

```ts
// Standalone mode
if (import.meta.main) {
  const { port } = startServer(3000);
  console.log(`Mock Appmixer API running on http://localhost:${port}`);
}
```

Replace with:

```ts
// Standalone mode
if (import.meta.main) {
  const envPort = Number(process.env.PORT);
  const { port } = startServer(Number.isFinite(envPort) ? envPort : 3000);
  console.log(`Mock Appmixer API running on http://localhost:${port}`);
}
```

- [ ] **Step 5: Smoke test the mock starts**

```bash
cd mock-server
PORT=0 bun run server.ts &
MOCK_PID=$!
sleep 1
kill $MOCK_PID
cd ..
```

Expected: the process starts and logs `Mock Appmixer API running on http://localhost:<random>`, then is killed cleanly.

- [ ] **Step 6: Commit**

```bash
git add mock-server/
git commit -m "chore: vendor mock-server from appmixer-cli"
```

---

## Task 10: Acceptance-test helper — spawn mock, set env vars

**Files:**
- Create: `internal/acctest/helper.go`

- [ ] **Step 1: Write the helper**

```go
package acctest

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"testing"
	"time"
)

// SpawnMock starts the Bun mock server on a free port and sets
// APPMIXER_BASE_URL / APPMIXER_USERNAME / APPMIXER_PASSWORD for the
// lifetime of the test binary. Returns a cleanup func.
func SpawnMock(t *testing.T) func() {
	t.Helper()
	port, err := freePort()
	if err != nil {
		t.Fatalf("freePort: %v", err)
	}

	root := repoRoot(t)
	cmd := exec.Command("bun", "run", "server.ts")
	cmd.Dir = filepath.Join(root, "mock-server")
	cmd.Env = append(os.Environ(), fmt.Sprintf("PORT=%d", port))
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		t.Fatalf("start mock: %v", err)
	}

	baseURL := fmt.Sprintf("http://127.0.0.1:%d", port)
	if err := waitReady(baseURL, 10*time.Second); err != nil {
		_ = cmd.Process.Kill()
		t.Fatalf("mock not ready: %v", err)
	}

	_ = os.Setenv("APPMIXER_BASE_URL", baseURL)
	_ = os.Setenv("APPMIXER_USERNAME", "admin@test.com")
	_ = os.Setenv("APPMIXER_PASSWORD", "test123")

	return func() {
		_ = cmd.Process.Kill()
		_, _ = cmd.Process.Wait()
	}
}

func freePort() (int, error) {
	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return 0, err
	}
	defer l.Close()
	return l.Addr().(*net.TCPAddr).Port, nil
}

func waitReady(url string, timeout time.Duration) error {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return fmt.Errorf("timeout waiting for %s", url)
		case <-ticker.C:
			req, _ := http.NewRequestWithContext(ctx, http.MethodGet, url+"/", nil)
			resp, err := http.DefaultClient.Do(req)
			if err == nil {
				resp.Body.Close()
				return nil
			}
		}
	}
}

func repoRoot(t *testing.T) string {
	t.Helper()
	_, file, _, _ := runtime.Caller(0) // internal/acctest/helper.go
	return filepath.Join(filepath.Dir(file), "..", "..")
}
```

- [ ] **Step 2: Confirm credentials match the mock**

The copied `mock-server/server.ts` validates against the hard-coded pair `admin@test.com` / `test123` (see `TEST_USER` near the top of the file). The helper above already uses those exact values. If you change the mock's test user later, update `SpawnMock` and `SpawnMockPackageLevel` to match.

- [ ] **Step 3: Compile**

Run: `go build ./...`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add internal/acctest/helper.go
git commit -m "test: add acceptance-test helper that spawns the mock server"
```

---

## Task 11: Implement `appmixer_config` — schema and `Create` (TDD)

**Files:**
- Create: `internal/resource/config.go`
- Create: `internal/resource/config_test.go`
- Modify: `internal/provider/provider.go` (register resource)

- [ ] **Step 1: Write failing acceptance test**

Create `internal/resource/config_test.go`:

```go
package resource_test

import (
	"os"
	"testing"

	"github.com/hashicorp/terraform-plugin-testing/helper/resource"

	"github.com/ellosoft/terraform-provider-appmixer/internal/acctest"
	appprovider "github.com/ellosoft/terraform-provider-appmixer/internal/provider"
	"github.com/hashicorp/terraform-plugin-framework/providerserver"
	"github.com/hashicorp/terraform-plugin-go/tfprotov6"
)

var protoV6Factories = map[string]func() (tfprotov6.ProviderServer, error){
	"appmixer": providerserver.NewProtocol6WithError(appprovider.New()()),
}

func TestMain(m *testing.M) {
	cleanup := acctest.SpawnMockPackageLevel()
	code := m.Run()
	cleanup()
	os.Exit(code)
}

func TestAccConfig_basic(t *testing.T) {
	resource.Test(t, resource.TestCase{
		ProtoV6ProviderFactories: protoV6Factories,
		Steps: []resource.TestStep{
			{
				Config: `
resource "appmixer_config" "x" {
  key   = "SAMPLE_KEY"
  value = "v1"
}
`,
				Check: resource.ComposeTestCheckFunc(
					resource.TestCheckResourceAttr("appmixer_config.x", "key", "SAMPLE_KEY"),
					resource.TestCheckResourceAttr("appmixer_config.x", "value", "v1"),
				),
			},
		},
	})
}
```

- [ ] **Step 2: Add package-level spawn helper**

Append to `internal/acctest/helper.go`:

```go
// SpawnMockPackageLevel is like SpawnMock but for use in TestMain. It
// skips the t.Helper plumbing and panics on error.
func SpawnMockPackageLevel() func() {
	port, err := freePort()
	if err != nil {
		panic(err)
	}
	root, _ := os.Getwd()
	// walk up until we find mock-server/
	for i := 0; i < 10; i++ {
		if _, err := os.Stat(filepath.Join(root, "mock-server")); err == nil {
			break
		}
		root = filepath.Dir(root)
	}
	cmd := exec.Command("bun", "run", "server.ts")
	cmd.Dir = filepath.Join(root, "mock-server")
	cmd.Env = append(os.Environ(), fmt.Sprintf("PORT=%d", port))
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		panic(err)
	}
	baseURL := fmt.Sprintf("http://127.0.0.1:%d", port)
	if err := waitReady(baseURL, 10*time.Second); err != nil {
		_ = cmd.Process.Kill()
		panic(err)
	}
	_ = os.Setenv("APPMIXER_BASE_URL", baseURL)
	_ = os.Setenv("APPMIXER_USERNAME", "admin@test.com")
	_ = os.Setenv("APPMIXER_PASSWORD", "test123")
	_ = os.Setenv("TF_ACC", "1")
	return func() {
		_ = cmd.Process.Kill()
		_, _ = cmd.Process.Wait()
	}
}
```

- [ ] **Step 3: Run, expect failure**

Run: `TF_ACC=1 go test ./internal/resource/ -run TestAccConfig_basic -v`
Expected: FAIL — `appmixer_config` resource type is not declared.

- [ ] **Step 4: Implement `internal/resource/config.go`**

```go
package resource

import (
	"context"
	"fmt"

	"github.com/hashicorp/terraform-plugin-framework/path"
	"github.com/hashicorp/terraform-plugin-framework/resource"
	"github.com/hashicorp/terraform-plugin-framework/resource/schema"
	"github.com/hashicorp/terraform-plugin-framework/resource/schema/planmodifier"
	"github.com/hashicorp/terraform-plugin-framework/resource/schema/stringplanmodifier"
	"github.com/hashicorp/terraform-plugin-framework/types"

	"github.com/ellosoft/terraform-provider-appmixer/internal/client"
)

type configResource struct {
	client *client.Client
}

func NewConfigResource() resource.Resource { return &configResource{} }

type configModel struct {
	ID    types.String `tfsdk:"id"`
	Key   types.String `tfsdk:"key"`
	Value types.String `tfsdk:"value"`
}

func (r *configResource) Metadata(_ context.Context, req resource.MetadataRequest, resp *resource.MetadataResponse) {
	resp.TypeName = req.ProviderTypeName + "_config"
}

func (r *configResource) Schema(_ context.Context, _ resource.SchemaRequest, resp *resource.SchemaResponse) {
	resp.Schema = schema.Schema{
		Attributes: map[string]schema.Attribute{
			"id": schema.StringAttribute{
				Computed:      true,
				PlanModifiers: []planmodifier.String{stringplanmodifier.UseStateForUnknown()},
			},
			"key": schema.StringAttribute{
				Required:      true,
				PlanModifiers: []planmodifier.String{stringplanmodifier.RequiresReplace()},
			},
			"value": schema.StringAttribute{
				Required:      true,
				Sensitive:     true,
				PlanModifiers: []planmodifier.String{stringplanmodifier.RequiresReplace()},
			},
		},
	}
}

func (r *configResource) Configure(_ context.Context, req resource.ConfigureRequest, resp *resource.ConfigureResponse) {
	if req.ProviderData == nil {
		return
	}
	c, ok := req.ProviderData.(*client.Client)
	if !ok {
		resp.Diagnostics.AddError("Unexpected provider data", fmt.Sprintf("%T", req.ProviderData))
		return
	}
	r.client = c
}

type configEntry struct {
	Key   string `json:"key"`
	Value any    `json:"value"`
}

func (r *configResource) Create(ctx context.Context, req resource.CreateRequest, resp *resource.CreateResponse) {
	var plan configModel
	resp.Diagnostics.Append(req.Plan.Get(ctx, &plan)...)
	if resp.Diagnostics.HasError() {
		return
	}
	body := configEntry{Key: plan.Key.ValueString(), Value: plan.Value.ValueString()}
	if _, err := client.Post[configEntry](ctx, r.client, "/config", body); err != nil {
		resp.Diagnostics.AddError("Create /config failed", err.Error())
		return
	}
	plan.ID = plan.Key
	resp.Diagnostics.Append(resp.State.Set(ctx, &plan)...)
}

func (r *configResource) Read(ctx context.Context, req resource.ReadRequest, resp *resource.ReadResponse) {
	var state configModel
	resp.Diagnostics.Append(req.State.Get(ctx, &state)...)
	if resp.Diagnostics.HasError() {
		return
	}
	all, err := client.Get[[]configEntry](ctx, r.client, "/config")
	if err != nil {
		resp.Diagnostics.AddError("Read /config failed", err.Error())
		return
	}
	key := state.Key.ValueString()
	for _, e := range all {
		if e.Key == key {
			state.Value = types.StringValue(fmt.Sprintf("%v", e.Value))
			state.ID = state.Key
			resp.Diagnostics.Append(resp.State.Set(ctx, &state)...)
			return
		}
	}
	resp.State.RemoveResource(ctx) // drift: removed server-side
}

func (r *configResource) Update(ctx context.Context, _ resource.UpdateRequest, resp *resource.UpdateResponse) {
	resp.Diagnostics.AddError("unexpected update", "appmixer_config has no PUT; changes to key or value force replacement")
}

func (r *configResource) Delete(ctx context.Context, req resource.DeleteRequest, resp *resource.DeleteResponse) {
	var state configModel
	resp.Diagnostics.Append(req.State.Get(ctx, &state)...)
	if resp.Diagnostics.HasError() {
		return
	}
	if _, err := client.Delete[map[string]any](ctx, r.client, "/config/"+state.Key.ValueString()); err != nil {
		resp.Diagnostics.AddError("Delete /config failed", err.Error())
	}
}

func (r *configResource) ImportState(ctx context.Context, req resource.ImportStateRequest, resp *resource.ImportStateResponse) {
	resource.ImportStatePassthroughID(ctx, path.Root("key"), req, resp)
}
```

- [ ] **Step 5: Register the resource in the provider**

In `internal/provider/provider.go`, replace the `Resources` method:

```go
func (p *appmixerProvider) Resources(_ context.Context) []func() resource.Resource {
	return []func() resource.Resource{
		resourcePkg.NewConfigResource,
	}
}
```

Add the import (rename to avoid clashing with the framework's `resource` package):

```go
resourcePkg "github.com/ellosoft/terraform-provider-appmixer/internal/resource"
```

- [ ] **Step 6: Run, expect pass**

Run: `TF_ACC=1 go test ./internal/resource/ -run TestAccConfig_basic -v`
Expected: PASS. If mock-server doesn't support `/config` yet, add the handler (see Task 12's troubleshooting note).

- [ ] **Step 7: Commit**

```bash
git add internal/resource/config.go internal/resource/config_test.go internal/provider/provider.go internal/acctest/helper.go
git commit -m "feat: implement appmixer_config resource with Create and Read"
```

---

## Task 12: Acceptance test for `RequiresReplace` on value change

**Files:**
- Modify: `internal/resource/config_test.go`

`appmixer_config` has no `UPDATE` verb; the schema marks `value` as `RequiresReplace`, so a value change must destroy and recreate. This test proves the lifecycle.

- [ ] **Step 1: Append `TestAccConfig_replaceOnValueChange`**

Append to `internal/resource/config_test.go`:

```go
func TestAccConfig_replaceOnValueChange(t *testing.T) {
	resource.Test(t, resource.TestCase{
		ProtoV6ProviderFactories: protoV6Factories,
		Steps: []resource.TestStep{
			{
				Config: `
resource "appmixer_config" "x" {
  key   = "REPLACE_ME"
  value = "first"
}
`,
				Check: resource.TestCheckResourceAttr("appmixer_config.x", "value", "first"),
			},
			{
				Config: `
resource "appmixer_config" "x" {
  key   = "REPLACE_ME"
  value = "second"
}
`,
				Check: resource.TestCheckResourceAttr("appmixer_config.x", "value", "second"),
				// Framework detects the implicit destroy+create in the plan; the
				// test step's default drift check validates state matches config
				// after the replacement.
			},
		},
	})
}
```

- [ ] **Step 2: Run**

Run: `TF_ACC=1 go test ./internal/resource/ -run TestAccConfig_replaceOnValueChange -v`
Expected: PASS. Test step 2 plans a destroy + create (both visible in verbose logs), then asserts the new value is in state after apply.

If the test fails with "no `PUT /config` handler" or similar, the provider's `Update` method should never be called — `RequiresReplace` should make the framework issue Delete then Create. If Update *is* being called, double-check that `stringplanmodifier.RequiresReplace()` is attached to the `value` attribute in `config.go`.

- [ ] **Step 3: Commit**

```bash
git add internal/resource/config_test.go
git commit -m "test: verify value change forces appmixer_config replacement"
```

---

## Task 13: Add `terraform import` support test

**Files:**
- Modify: `internal/resource/config_test.go`

- [ ] **Step 1: Append import test**

Append to `config_test.go`:

```go
func TestAccConfig_import(t *testing.T) {
	resource.Test(t, resource.TestCase{
		ProtoV6ProviderFactories: protoV6Factories,
		Steps: []resource.TestStep{
			{
				Config: `
resource "appmixer_config" "x" {
  key   = "IMPORT_KEY"
  value = "to-be-imported"
}
`,
			},
			{
				ResourceName:      "appmixer_config.x",
				ImportState:       true,
				ImportStateId:     "IMPORT_KEY",
				ImportStateVerify: true,
				// `value` is sensitive and not round-tripped reliably from a fresh import;
				// accept that it may not match until the next apply.
				ImportStateVerifyIgnore: []string{"value"},
			},
		},
	})
}
```

- [ ] **Step 2: Run, expect pass**

Run: `TF_ACC=1 go test ./internal/resource/ -run TestAccConfig_import -v`
Expected: PASS. The resource's existing `ImportState` implementation (Task 11) already passes through by `key`, so no code changes should be required.

If it fails because `Read` can't find the imported key, the mock's `GET /config` handler needs to echo back keys that were set via POST. Fix the mock and retry.

- [ ] **Step 3: Commit**

```bash
git add internal/resource/config_test.go
git commit -m "test: cover appmixer_config terraform import"
```

---

## Task 14: Example HCL for `tfplugindocs`

**Files:**
- Create: `examples/resources/appmixer_config/resource.tf`
- Create: `examples/resources/appmixer_config/import.sh`

- [ ] **Step 1: Write `resource.tf`**

```hcl
resource "appmixer_config" "jwt" {
  key   = "JWTSecret"
  value = var.jwt_secret
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}
```

- [ ] **Step 2: Write `import.sh`**

```bash
terraform import appmixer_config.jwt JWTSecret
```

- [ ] **Step 3: Commit**

```bash
git add examples/resources/appmixer_config/
git commit -m "docs: add appmixer_config example for tfplugindocs"
```

---

## Task 15: Install and run `tfplugindocs`

**Files:**
- Create: `docs/resources/config.md` (generated)

- [ ] **Step 1: Install the tool**

```bash
go install github.com/hashicorp/terraform-plugin-docs/cmd/tfplugindocs@latest
```

- [ ] **Step 2: Generate docs**

```bash
cd /Users/vgmello-dev/repos/projects/terraform-provider-appmixer
tfplugindocs generate
```

Expected: `docs/` directory populated with provider + resource docs derived from schemas and `examples/`.

- [ ] **Step 3: Commit**

```bash
git add docs/
git commit -m "docs: generate tfplugindocs output"
```

---

## Task 16: README — `dev_overrides` instructions

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace README contents**

```markdown
# terraform-provider-appmixer

Terraform provider for managing an [Appmixer](https://appmixer.com) tenant.

**Status:** Foundation + `appmixer_config` only. More resources coming in follow-up plans.

## Local development (`dev_overrides`)

1. Build the provider locally:
   ```bash
   go build -o terraform-provider-appmixer
   ```
2. Note the absolute path to the resulting binary's directory.
3. Add the following to `~/.terraformrc`:
   ```hcl
   provider_installation {
     dev_overrides {
       "ellosoft/appmixer" = "/absolute/path/to/terraform-provider-appmixer"
     }
     direct {}
   }
   ```
4. In your HCL, reference the provider without declaring a `required_providers` version:
   ```hcl
   provider "appmixer" {
     base_url = "https://api.your-tenant.appmixer.cloud"
     username = "admin@example.com"
     password = var.appmixer_password
   }

   resource "appmixer_config" "jwt" {
     key   = "JWTSecret"
     value = var.jwt_secret
   }
   ```
5. Run `terraform plan` / `terraform apply` — Terraform will print a warning about the override; ignore it during dev.

## Running tests

Unit tests (fast, no external deps):
```bash
go test ./internal/client/ ./internal/provider/
```

Acceptance tests (spawn mock-server subprocess):
```bash
TF_ACC=1 go test ./internal/resource/ -v
```

Requires [Bun](https://bun.sh) installed and `mock-server/node_modules` populated via `cd mock-server && bun install`.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add dev_overrides and test instructions to README"
```

---

## Task 17: Final smoke test — build + all tests green

- [ ] **Step 1: Build the binary**

```bash
go build ./...
```

Expected: no errors; `terraform-provider-appmixer` binary created at repo root.

- [ ] **Step 2: Run unit tests**

```bash
go test ./internal/client/ ./internal/provider/ -v
```

Expected: all PASS.

- [ ] **Step 3: Run acceptance tests**

```bash
TF_ACC=1 go test ./internal/resource/ -v
```

Expected: `TestAccConfig_basic` and `TestAccConfig_import` PASS.

- [ ] **Step 4: Tag the foundation milestone**

```bash
git tag v0.0.1
```

This marks the end of Plan 01. Follow-up plans (service-config, acl, modifiers, flow, account, user) will each add one resource without modifying the foundation.

---

## Summary

By end of this plan you have:

- A Go repo `terraform-provider-appmixer` buildable via `go build ./...`
- A provider that authenticates against an Appmixer instance
- Working `appmixer_config` resource (Create + Read + Delete + Import), with destroy/replace semantics
- A copied + running mock-server for acceptance tests
- Unit tests for the HTTP client (Get/Post/Put/Delete/error decoding/Login)
- Acceptance tests for `appmixer_config`
- Generated provider docs under `docs/`
- README with `dev_overrides` instructions for local use

The remaining six resources (`service_config`, `acl`, `modifiers`, `flow`, `account`, `user`) each follow the same task pattern: failing acceptance test → schema → CRUD → import → example → docs. Each gets its own plan file in `docs/superpowers/plans/`.
