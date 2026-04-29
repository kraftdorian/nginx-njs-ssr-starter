# nginx-njs-ssr-starter

## Purpose

This repository is a small, public-facing SSR starter for NGINX + `njs`.

It exists to show a constrained rendering model:

- HTML rendered directly inside NGINX with `js_content`
- no Node.js application server
- no build step for the HTML render path
- explicit, synchronous, string-first rendering

This file is intentionally short. It is the repo-level source of truth for what this project is, what it is not, and which technical guardrails should remain in place as the repository evolves.

## Current Shape

The MVP currently includes:

- a reusable HTML runtime in `lib/runtime/`
- a reusable Markdown companion runtime in `lib/runtime/markdown.njs`
- an explicit HTML helper allowlist in `lib/runtime/tags.njs`
- one generic example app in `examples/basic/`
- one `js_content` render entrypoint
- one example `nginx.conf`
- a CLI-first validation entrypoint
- probe-style validation modules
- installation-oriented public documentation in `README.md`

Canonical file layout:

```text
/README.md
/LICENSE
/lib/runtime/html.njs
/lib/runtime/markdown.njs
/lib/runtime/tags.njs
/examples/basic/render.njs
/examples/basic/views/Home.njs
/examples/basic/components/Layout.njs
/examples/basic/content/site.njs
/examples/basic/probes/probe-*.njs
/examples/basic/validate-runtime.njs
/examples/basic/nginx.conf
```

## Project Positioning

This repository is:

- a starter
- a reference implementation
- a small SSR runtime for NGINX `njs`

This repository is not:

- a general-purpose web framework
- a React/Vue replacement
- a hydration system
- a static asset pipeline
- a production policy bundle for CSP, SRI, or deployment-specific logic

## Technical Guardrails

When changing this repository, preserve these constraints unless there is an explicit decision to widen scope:

- keep the runtime synchronous
- keep the runtime string-first
- keep node structures as plain JavaScript objects and arrays
- prefer small explicit functions over framework-style abstraction
- keep helper-tag registration based on an explicit allowlist
- do not depend on `Proxy` for core helper behavior
- keep the request handler explicit and small
- reject `on*` attributes
- keep escaping and fail-fast validation in the runtime core
- keep rooted imports compatible with `js_path /etc/nginx/njs;`

In tradeoffs, prefer:

- genericity over site-specific convenience
- installation simplicity over feature expansion
- documentation clarity over cleverness
- license safety over copying from prior/internal code

## Runtime Contract

The public runtime API should stay small and explicit:

- `h(tag, props, ...children)`
- `h.tagName(props, ...children)` for supported HTML tags
- `rawText(value)`
- `renderToString(node)`
- `jsonLd(data)`
- `inlineScript(code, nonce)`
- `inlineModule(code, nonce)`

Optional Markdown companion contract:

- `lib/runtime/markdown.njs`
- `renderToString(node)` using the same AST shape as the HTML runtime
- derive only a small metadata preamble for supported head tags
- keep Markdown support opt-in and separate from the HTML runtime module

The helper allowlist in `lib/runtime/tags.njs` is the canonical source of tag coverage.

Scope boundaries:

- standard HTML helper tags: yes
- deprecated / obsolete / experimental tags: no
- SVG helpers: no
- MathML helpers: no
- custom elements: supported through plain `h('my-element', ...)`

## Example App Guardrails

The example should remain generic and installable:

- canonical route: `/`
- canonical example port: `8080`
- full `<!DOCTYPE html>` document render
- HTML as the default response shape
- optional Markdown response for explicit `Accept: text/markdown` requests demonstrated in the example handler
- request-local context created once in the handler and passed explicitly
- no personal branding
- no private business logic
- no production-specific deployment coupling

If nonce support is demonstrated, keep it optional and example-scoped. Nonce generation and CSP policy management are not part of the core runtime.

## Validation Guardrails

The validation story should remain CLI-first and probe-based.

Keep:

- `examples/basic/validate-runtime.njs` as the summary entrypoint
- focused probes under `examples/basic/probes/`
- runtime validation for escaping, attribute failure behavior, markdown rendering behavior, and example render output
- an example NGINX config that remains coherent with the README

Target validation flow:

1. `njs -v`
2. run the checked-in validation entrypoint
3. validate the example `nginx.conf`
4. smoke-test `/` on port `8080`
5. confirm `Content-Type: text/html; charset=utf-8` and leading `<!DOCTYPE html>`
6. smoke-test `/` with `Accept: text/markdown`
7. confirm `Content-Type: text/markdown; charset=utf-8`, `Vary: Accept`, and markdown output with the small preamble

## Compatibility Baseline

Document and preserve the current MVP baseline unless intentionally changed:

- Linux as the primary runtime target
- NGINX OSS `>= 1.24`
- `njs >= 0.9.6`
- required module: `ngx_http_js_module.so`
- recommended local environment: WSL + Ubuntu 24.04 LTS

Windows and macOS may be used for authoring, but they are not the primary server runtime targets for this starter.

## Documentation Guardrails

`README.md` should stay aligned with the actual repo contents.

It should continue to document:

- what the project is
- why it exists
- compatibility and recommended environment
- installation via clone into `/etc/nginx/njs`
- module loading and `js_path` setup
- runtime API and helper coverage
- the opt-in Markdown companion runtime and example negotiation path
- validation workflow
- intentional limitations and non-goals

## Explicit Exclusions

Do not introduce these into the core starter without an intentional scope change:

- JSX or compile-time transforms
- a Node.js SSR server
- hydration
- framework-style state abstractions
- automatic routing conventions
- static asset bundling requirements
- SRI workflows
- site-specific CSP values
- personal or business metadata
- private/internal deployment logic

## Agent Notes

Agents should treat this file as the working guardrail document for the repository.

If a change would conflict with the points above, do not silently widen scope. Prefer the current constraints unless the repository direction is explicitly updated.
