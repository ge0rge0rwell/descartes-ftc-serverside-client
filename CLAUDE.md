# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**Descartes FTC AI** — an AI chat assistant for FIRST Tech Challenge (FTC) teams,
shipped as a **WordPress plugin**. A floating chat widget answers questions about
the game manual (current season: **DECODE**) with page citations, alongside an
embedded Adobe PDF viewer. Built with **React 19 + Vite 7**.

The React app builds to `dist/assets/index.js` + `index.css`, which the PHP plugin
(`descartes-ftc.php`) enqueues and mounts into a `<div id="root">` in the site footer.

## Commands

> **Windows note:** the `vite`/`eslint` shims may not resolve on this shell. Invoke the
> JS entrypoints through Node directly if `npm run dev` fails with
> `'vite' is not recognized`:

```bash
node node_modules/vite/bin/vite.js --host      # dev server (HMR)
node node_modules/vite/bin/vite.js build       # production build -> dist/
node node_modules/eslint/bin/eslint.js .       # lint
```

`npm run dev | build | lint | preview` are the intended scripts when shims work.

**Known install gotcha:** the npm optional-dependency bug can omit the platform
rollup binary, causing `Cannot find module @rollup/rollup-win32-x64-msvc` at build.
Fix: `npm install @rollup/rollup-win32-x64-msvc` (or remove `node_modules` +
`package-lock.json` and reinstall).

`vite.config.js` pins **fixed asset filenames** (`assets/[name].js`) so the PHP
plugin can reference `dist/assets/index.js`/`index.css` — do not switch to hashed
names without updating `descartes-ftc.php`.

## Architecture

| Path | Role |
|------|------|
| `src/App.jsx` | Widget shell: FAB, glass panel, chat/PDF panes, message state, send loop |
| `src/components/AdobeViewer.jsx` | Embeds Adobe View SDK; `gotoLocation(page)` on citation click |
| `src/services/geminiService.js` | **Misnamed** — calls **OpenRouter** (`mistral-7b-instruct:free`), not Gemini. Injects manual search results into the system message, then scrubs reasoning-token leakage |
| `src/services/searchService.js` | Naive term-frequency search over `data/manual-index.json` (dynamic-imported to keep the bundle small) |
| `src/utils/ftcKnowledge.js` | `DESCARTES_SYSTEM_PROMPT` + structured DECODE knowledge base |
| `src/data/manual-index.json` | ~357 KB / 180 page entries `{page, content}`; lazy-loaded |
| `src/styles/main.css` | The entire visual system (only stylesheet `App.jsx` imports) |
| `descartes-ftc.php` | WordPress plugin: enqueues the built bundle, prints `#root` |

**Citations:** the model is prompted to emit `[[<page>]](#<page>)`. That is valid
markdown link syntax, so `react-markdown` renders it and a custom `a` component
intercepts `#<page>` hrefs to drive the PDF viewer (`setPdfPage` + show the Manual pane).

**Styling:** `src/styles/main.css` is the active stylesheet. The files under
`src/styles/base/` and `src/styles/layout/` are **orphaned** (nothing imports them) —
don't edit them expecting visual changes. `src/index.css` holds only a temporary
**dev-only** body backdrop to make the widget's glass effect visible; it has no effect
in the WordPress embed.

**Theme tokens** (in `main.css :root`): brand brick-red `#832A22`, mist-gray `#DAD9DF`,
warm inks. Prefer the CSS variables over hardcoded colors.

## Conventions

- Match the existing code style (2-space indent, single quotes, no semicolons in `App.jsx`).
- Keep `node_modules/` churn out of commits (the repo unfortunately tracks `node_modules`
  and has no `.gitignore`; commit only `src/`, `package*.json`, `dist/`).
- After UI changes, rebuild `dist/` so the WordPress plugin reflects them.

---

## Plans — audit-driven hardening (open work)

A 4-lens review (correctness, performance, UX/design, a11y/security) produced the
following backlog. Apply in order; re-lint, re-build, and screenshot after each batch.

### 🔴 CRITICAL — secrets (action required, not just code)
- **OpenRouter API key is exposed.** `VITE_`-prefixed env vars are inlined into the
  client bundle, and a real key is in git history (commits `fb15528`, `13fa04e`).
  1. **Revoke** the leaked/active key in OpenRouter immediately (treat as compromised).
  2. Move the call **server-side**: add a WordPress REST/AJAX proxy that holds the key
     in server config and forwards to OpenRouter; the client calls same-origin with a
     `wp_create_nonce` + rate limiting. Remove `VITE_OPENROUTER_API_KEY` from the client.
  3. Purge history (`git filter-repo`) or rotate and consider the repo burned.
  4. Add a `.gitignore` (`node_modules/`, `dist/`, `.env*`, `Archive.zip`).
- `VITE_ADOBE_CLIENT_ID` is likewise inlined — lower risk, but confirm domain allow-listing.

### Batch A — data layer (`geminiService.js`, `searchService.js`)
- Guard null model content: `let cleanedContent = rawContent ?? ''` before the regex
  chain; coerce `scrubResponse` input with `String(raw ?? '')`. A valid empty reply
  currently surfaces as a false "Connection issue."
- Wrap the error-branch `response.json()` in try/catch (non-JSON error bodies throw and
  mask the real HTTP status).
- Search scoring: tokenize on `/\s+/`, strip punctuation per token, count occurrences
  without `String.split` allocations, and avoid spreading all 180 page objects per query.

### Batch B — `AdobeViewer.jsx`
- On `pdfUrl` change, reset `isReady=false` and clear the `#adobe-dc-view` container so a
  stale viewer / stuck "Loading manual…" can't persist; null out `adobeApiRef`.

### Batch C — `App.jsx`
- **Perf:** memoize markdown **per message** (parse once per content, not on every
  `isTyping` toggle); give messages a stable `id` and key on it (not array index);
  `React.lazy` the Adobe viewer + mount only once the Manual pane/maximize is first shown
  (defers the third-party SDK for chat-only users).
- **Correctness:** refactor send into a `runCompletion(list)` helper; fix retry so it
  drops the trailing error and re-sends **without** duplicating the user message.
- **A11y:** dialog `inert` when closed + focus trap + restore focus to the FAB on close +
  `aria-modal`; replace the list-wide `aria-live` with a dedicated visually-hidden
  `role="status"` region carrying only the latest assistant reply; convert Chat/Manual
  `role="tab"` to plain `aria-pressed` toggle buttons (panes aren't wired as tabpanels);
  gate `scrollIntoView` behavior on `prefers-reduced-motion`.
- **Security (defense-in-depth):** in the custom link renderer, only treat
  `https?:`/`mailto:` non-citation hrefs as links.
- **UX:** send-button spinner while `isTyping`; "Suggested" overline above the chips.

### Batch D — `main.css`
- Gate `backdrop-filter` + the idle `statusPulse`/blur behind the open state
  (`visibility:hidden` on `.chat-overlay.closed`) so closed widgets don't burn GPU on
  every host page.
- Add `:focus-visible` rings (scoped to `.chat-widget-container`; invert on the FAB),
  `.sr-only` utility, `.send-spinner`, a bespoke `userPop` user-bubble entrance, an
  empty-state radial brand wash, panel inset top-highlight.
- Bubble spacing `12px 16px` / `line-height 1.55`; tables `display:block;overflow-x:auto`;
  `pre` `max-height:320px`; Firefox `scrollbar-width/color`; `overscroll-behavior:contain`
  on `.chat-messages`.
- Use `--ease-out` (not spring) for hover transforms; reserve spring for entrances.
- **Contrast:** darken `--ink-faint` (`#9c938f`, 3.0:1 — fails AA) to ≈`#7a716d`; pick a
  contrast-passing "copied" color; soften the off-palette `#2bb573` status dot.
- Add `scroll-behavior:auto !important` inside the `prefers-reduced-motion` block.

### Verified-good (no change needed)
- `react-markdown` escapes HTML and its `defaultUrlTransform` already neutralizes
  `javascript:` URIs — no markdown XSS.
- `manual-index.json` is correctly code-split via dynamic import.
- The `isTyping` guard correctly prevents out-of-order responses (though a second message
  typed mid-flight is silently dropped — consider queueing or disabling the textarea).
