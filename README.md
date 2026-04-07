# nginx-njs-ssr-starter

A small, generic SSR starter for Nginx JavaScript (`njs`).

This repository demonstrates a string-first HTML rendering model that runs directly inside Nginx with `js_content`. There is no Node.js application server, no frontend build step, and no framework runtime hidden behind the render path. The goal is to keep the moving parts easy to inspect while still shipping a reusable runtime, a working example app, an example `nginx.conf`, and a CLI-first validation flow.

## Why This Exists

This repository started as a real-world experiment.

I was already running a personal website powered by NGINX with `njs` and CSP nonce handling. At some point, I wanted to explore how far this setup could go beyond simple request logic — specifically, whether it could handle structured HTML rendering in a React/Vue-like mental model.

The result is a deliberately constrained SSR MVP implemented directly inside NGINX using `js_content`.

This project exists to explore that boundary:
- how far server-side rendering can be pushed inside `njs`
- what trade-offs emerge when you remove Node.js and framework runtimes
- how much control you gain over HTML, CSP, nonce handling, and output determinism

It is intentionally not a framework. It is a focused experiment, extracted into a reusable starter after being validated on a real personal site.

---

## What This Project Is (and Is Not)

This repository is:

- a minimal SSR runtime running directly inside NGINX
- a reference implementation of a string-first rendering model
- a production-backed experiment, not a toy example
- a tool for understanding low-level rendering, not abstracting it away

This repository is not:

- a replacement for React, Vue, or Next.js
- a general-purpose SSR framework
- a full application platform
- an attempt to recreate frontend ecosystems inside NGINX

---

## Design Motivation

The design is shaped by a few explicit constraints:

- synchronous rendering only (no async, no external I/O)
- no hidden global state
- explicit request-local context (`ctx`)
- deterministic HTML output
- security-first defaults (escaping, restricted attributes)
- minimal runtime surface area

These constraints are not limitations — they are the point of the experiment.

---

## What I Learned

This project also served as an exploration of development workflow:

- coordinating between a text-oriented model (ChatGPT) and a code-oriented agent (Codex)
- iterating on architecture while keeping constraints explicit and enforceable
- validating ideas through a real deployment rather than isolated examples

The implementation work for this MVP was carried out with Codex used as the coding agent, under explicit architectural and scope constraints.

It reinforced an important engineering principle:

> constraints, not features, define the shape and quality of a system

---

## When This Approach Makes Sense

- small, mostly static sites
- full control over HTML output is required
- CSP / nonce / security constraints are important
- you want to eliminate application servers and reduce moving parts

## When It Does Not

- dynamic applications with data fetching
- complex routing and application state
- teams relying on established frontend ecosystems
- anything that benefits from hydration or client-side reconciliation

---

## Why Not Use a Framework?

For this specific use case:

- a full SSR framework would introduce unnecessary runtime complexity
- a Node.js server would add an extra layer that was not required
- the goal was not developer convenience, but system transparency and control

This project explores what happens when those layers are intentionally removed.

## Feature Summary

- Generic HTML runtime in [`lib/runtime/html.njs`](./lib/runtime/html.njs)
- Explicit helper allowlist in [`lib/runtime/tags.njs`](./lib/runtime/tags.njs)
- One example application rooted at `/`
- `js_content` render entrypoint in [`examples/basic/render.njs`](./examples/basic/render.njs)
- Minimal copy-pasteable Nginx config in [`examples/basic/nginx.conf`](./examples/basic/nginx.conf)
- CLI-first runtime validation entrypoint in [`examples/basic/validate-runtime.njs`](./examples/basic/validate-runtime.njs)
- Focused probe modules for runtime behavior and doubtful engine features
- No static asset pipeline and no bundled frontend build tooling

## Compatibility Floor

Working MVP assumptions for this repository:

- Linux is the primary runtime target
- Nginx OSS `>= 1.24`
- `njs >= 0.9.6`
- Required dynamic module: `ngx_http_js_module.so`
- `qjs` is out of scope for the MVP
- Windows and macOS are acceptable authoring environments, but not first-class server runtime targets for this starter

## Recommended Local Development Environment

The recommended first-time validation path is:

- WSL with Ubuntu 24.04 LTS
- official `nginx.org` Ubuntu packages
- `nginx-module-njs` installed as a dynamic module
- repository cloned directly to `/etc/nginx/njs`

This keeps local validation close to the intended production-style setup and mirrors the configuration model used by the repository example.

## Installation

### 1. Prepare Ubuntu 24.04 with official nginx.org packages

Install the prerequisites:

```bash
sudo apt update
sudo apt install curl gnupg2 ca-certificates lsb-release ubuntu-keyring
```

Import the official NGINX signing key:

```bash
curl https://nginx.org/keys/nginx_signing.key | gpg --dearmor \
    | sudo tee /usr/share/keyrings/nginx-archive-keyring.gpg >/dev/null
```

Verify the key fingerprint. It should include:

```text
573BFD6B3D8FBC641079A6ABABF5BD827BD9BF62
```

Use the check shown in the official package instructions:

```bash
gpg --dry-run --quiet --no-keyring --import --import-options import-show \
    /usr/share/keyrings/nginx-archive-keyring.gpg
```

Add the official stable repository:

```bash
echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] \
https://nginx.org/packages/ubuntu `lsb_release -cs` nginx" \
    | sudo tee /etc/apt/sources.list.d/nginx.list
```

Prefer the `nginx.org` packages over distro-provided packages:

```bash
echo -e "Package: *\nPin: origin nginx.org\nPin: release o=nginx\nPin-Priority: 900\n" \
    | sudo tee /etc/apt/preferences.d/99nginx
```

Install NGINX and the dynamic `njs` module package:

```bash
sudo apt update
sudo apt install nginx nginx-module-njs
```

### 2. Clone this repository into the Nginx module path

```bash
sudo git clone https://github.com/kraftdorian/nginx-njs-ssr-starter.git /etc/nginx/njs
```

### 3. Load the HTTP JavaScript module

Add this at the main `nginx.conf` level, before the `http {}` block:

```nginx
load_module modules/ngx_http_js_module.so;
```

### 4. Use the example configuration

You can start from [`examples/basic/nginx.conf`](./examples/basic/nginx.conf) or merge the important bits into your existing config:

```nginx
load_module modules/ngx_http_js_module.so;

worker_processes auto;
error_log stderr info;
pid /tmp/nginx.pid;

events {
    worker_connections 1024;
}

http {
    js_path /etc/nginx/njs;
    js_import render from examples/basic/render.njs;

    server {
        listen 8080;
        server_name _;

        location = / {
            js_content render.handle;
        }
    }
}
```

### 5. Validate and start Nginx

Check the installed versions:

```bash
nginx -v
njs -v
```

Run the checked-in probe summary from the repository root with the repository root on the `njs` module path:

```bash
cd /etc/nginx/njs
njs -p /etc/nginx/njs examples/basic/validate-runtime.njs
```

Validate the Nginx configuration and start the server:

```bash
sudo nginx -t -p /etc/nginx -c /etc/nginx/njs/examples/basic/nginx.conf
sudo nginx -p /etc/nginx -c /etc/nginx/njs/examples/basic/nginx.conf
```

## Directory Layout

```text
/README.md
/LICENSE
/lib/runtime/html.njs
/lib/runtime/tags.njs
/examples/basic/render.njs
/examples/basic/views/Home.njs
/examples/basic/components/Layout.njs
/examples/basic/content/site.njs
/examples/basic/probes/probe-*.njs
/examples/basic/validate-runtime.njs
/examples/basic/nginx.conf
```

## First Render Example

The runtime stays intentionally small and explicit:

```javascript
import runtime from 'lib/runtime/html.njs';

var h = runtime.h;

var html = runtime.renderToString(
    h.article(
        { className: 'card' },
        h.h1('Hello from njs'),
        h.p('No Node.js application server required.')
    )
);
```

Public runtime API:

- `h(tag, props, ...children)`
- `h.tagName(props, ...children)` for supported HTML helper tags
- `rawText(value)`
- `renderToString(node)`
- `jsonLd(data)`
- `inlineScript(code, nonce)`
- `inlineModule(code, nonce)`

## Runtime Model

The runtime in [`lib/runtime/html.njs`](./lib/runtime/html.njs) is intentionally:

- synchronous
- string-first
- based on plain objects and arrays
- built from small explicit rendering and validation functions
- fail-fast for unsupported prop payloads and `on*` attributes

Internal behavior includes:

- HTML text escaping
- HTML attribute escaping
- script-like content escaping for JSON-LD and inline script helpers
- nested child-array flattening
- deterministic attribute serialization
- explicit void-element handling
- alias mapping such as `className -> class`

## Supported HTML Helper Tags

The canonical allowlist lives in [`lib/runtime/tags.njs`](./lib/runtime/tags.njs). This MVP includes helper aliases for the following non-deprecated HTML elements and does not currently trim the recommended set.

- Document and metadata: `html`, `head`, `title`, `base`, `link`, `meta`, `style`, `body`
- Sectioning: `address`, `article`, `aside`, `footer`, `header`, `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `hgroup`, `main`, `nav`, `section`, `search`
- Text content: `blockquote`, `dd`, `div`, `dl`, `dt`, `figcaption`, `figure`, `hr`, `li`, `menu`, `ol`, `p`, `pre`, `ul`
- Inline text semantics: `a`, `abbr`, `b`, `bdi`, `bdo`, `br`, `cite`, `code`, `data`, `dfn`, `em`, `i`, `kbd`, `mark`, `q`, `rp`, `rt`, `ruby`, `s`, `samp`, `small`, `span`, `strong`, `sub`, `sup`, `time`, `u`, `var`, `wbr`
- Image and media: `area`, `audio`, `img`, `map`, `track`, `video`
- Embedded and scripting-related: `canvas`, `embed`, `iframe`, `noscript`, `object`, `picture`, `script`, `source`
- Edits and tables: `del`, `ins`, `caption`, `col`, `colgroup`, `table`, `tbody`, `td`, `tfoot`, `th`, `thead`, `tr`
- Forms: `button`, `datalist`, `fieldset`, `form`, `input`, `label`, `legend`, `meter`, `optgroup`, `option`, `output`, `progress`, `select`, `textarea`
- Interactive and web components: `details`, `dialog`, `summary`, `slot`, `template`

Out of scope for helper aliases:

- deprecated or obsolete HTML elements
- experimental elements
- SVG helpers
- MathML helpers

Custom elements remain available through plain `h('my-element', props, ...children)`.

## Validation Workflow

This repository is CLI-first for renderer validation. The probe suite is designed so you can check runtime behavior before discovering issues through a running browser session.

Run the validation entrypoint:

```bash
cd /etc/nginx/njs
njs -p /etc/nginx/njs examples/basic/validate-runtime.njs
```

Expected output shape:

```text
NJS runtime validation summary

Passed: 7/7
Failed: 0/7
Required passed: 4/4

Final verdict: SAFE TO USE
```

The checked-in probes cover:

- `Map` support
- async generator syntax support
- `Proxy` support
- core runtime rendering behavior
- attribute validation and failure behavior
- JSON-LD and inline script helper behavior
- full example document rendering

The first three probes are informational. The runtime does not depend on them.

## HTTP Smoke Check

With the example config running on port `8080`, use the canonical route `/`:

```bash
curl -i http://127.0.0.1:8080/
```

You should confirm:

- the status is `200`
- the response includes `Content-Type: text/html; charset=utf-8`
- the body begins with `<!DOCTYPE html>`

For a quick doctype-only check:

```bash
curl -s http://127.0.0.1:8080/ | head -c 15
```

Expected leading bytes:

```text
<!DOCTYPE html>
```

## Example App Notes

The example app is intentionally generic:

- route: `/`
- listen port: `8080`
- one root view with a full HTML document
- explicit request context creation in the handler
- neutral example content
- one inline script example
- one neutral JSON-LD example

Optional nonce handling is example-scoped only. If you expose an `example_nonce` variable in your own Nginx configuration, the inline script helper will render it as a normal `nonce` attribute. The starter does not generate CSP nonces for you.

## Security Model and Limitations

Security-aware behavior included in the MVP:

- normal text children are escaped by default
- attribute values are escaped by default
- raw output requires explicit `rawText(...)`
- `on*` attributes are rejected
- unsupported prop payloads fail fast
- boolean attributes render explicitly
- inline script helpers escape script-like text content

Intentional non-goals for this repository:

- SRI generation
- site-specific CSP policies
- nonce generation policy
- hydration
- JSX
- automatic routing
- automatic head management
- static asset bundling or a frontend asset pipeline
- production-specific request or business logic

`rawText(...)` bypasses HTML escaping by design. Treat it as a sharp tool and keep it for content you explicitly trust.

## What Is Intentionally Out Of Scope

- React compatibility
- a Node.js application server
- file-system routing
- build tooling for SSR
- bundled static assets
- SVG and MathML helper coverage
- Nginx Plus-specific features
- QuickJS-specific runtime targeting

## Troubleshooting

### `unknown directive "js_path"` or `unknown directive "js_content"`

The `ngx_http_js_module` dynamic module is not loaded. Confirm that `load_module modules/ngx_http_js_module.so;` is present in the main configuration context.

### `Cannot find module`

The repository root must be on the NJS module path for rooted imports such as `lib/runtime/html.njs` and `examples/basic/views/Home.njs`. Re-run the CLI validation from the repository root and include the root with `njs -p /etc/nginx/njs`.

### `njs: command not found`

Install `nginx-module-njs`. The NJS command-line utility is available after installing the package from the supported Linux package flow.

### Response is `500 Internal Server Error`

Check the NGINX error log. The example handler logs a warning before returning a clear `500` response when rendering fails.

## Considered Post-MVP Directions

- additional example routes and handlers
- a second example app with richer composition patterns
- optional CSP nonce wiring examples
- broader probe coverage for deployment diagnostics
- additional documentation for alternative Linux layouts beyond `/etc/nginx/njs`

These are directions, not current MVP promises.

## License

This project is licensed under the MIT License. See [`LICENSE`](./LICENSE).

## Official References

- NGINX Linux packages: https://nginx.org/en/linux_packages.html
- njs overview and CLI docs: https://nginx.org/en/docs/njs/
- `ngx_http_js_module` docs: https://nginx.org/en/docs/http/ngx_http_js_module.html
