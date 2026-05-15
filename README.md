# DataTree

[Русская версия](./README.ru.md)

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Vue](https://img.shields.io/badge/vue-3.5-green)
![Privacy](https://img.shields.io/badge/privacy-local--only-success)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

Local API Payload Inspector for developers who need to understand, validate, compare, and prepare JSON/XML payloads quickly without uploading sensitive data.

**Live Demo:** [datatree.space-dev.tech](https://datatree.space-dev.tech)

![DataTree Inspect](./public/d08d4c58df1545545114323379e35313_1767894518.png)
![DataTree Transform](./public/screenshots/transform-mode.png)

## Positioning

DataTree is not a chat assistant. It is a local, offline-ready workbench for API payloads:

- inspect a response in seconds;
- generate and validate contracts;
- compare payloads semantically;
- transform payloads for tickets, docs, tests, and pull requests.

Everything runs in your browser.

## Product Modes

### Inspect

- Virtualized payload tree for JSON and XML.
- Search, copy values, copy JSON paths, JS paths, JSONPath, and XPath.
- Smart insights for secrets, nullables, empty collections, mixed arrays, duplicate ids, deep paths, large branches, and date-like fields.
- JSONPath and XPath query/extract with JSON/CSV copy.

### Validate

- Generate JSON Schema, TypeScript interfaces, and Zod schemas from a payload.
- Validate payloads with AJV and JSON Schema draft 2020-12.
- See contract issues with severity, paths, and source locations.
- Analyze required/optional fields, nullable fields, enum candidates, array shapes, and format hints.

### Compare

- Semantic diff for JSON/XML payloads.
- Ignore keys, volatile fields, array order, type-only differences, and normalized dates.
- Compare arrays by stable keys such as `id`, `uuid`, or `name`.
- Classify changes as breaking, non-breaking, warning, or neutral.
- Export JSON Patch, CSV, unified diff, and HTML reports.

### Transform

- Format, minify, and sort JSON.
- Convert JSON ↔ XML with configurable attribute and text-node handling.
- Flatten JSON/XML payloads into CSV/table previews.
- Redact secrets with common key rules and custom rules before sharing payloads.
- Generate TypeScript, Zod, JSON Schema, and typed fetch/axios snippets.

## Fast Onboarding Examples

The app ships with local examples for realistic developer workflows:

- REST response;
- error payload;
- OpenAPI-like payload;
- XML service config;
- JSON Schema validation payload;
- package/config examples.

Open the command palette with `Cmd/Ctrl + K` and load an example instantly.

## Privacy Promise

DataTree is local-first:

- payloads are parsed, inspected, validated, compared, transformed, and stored in your browser;
- payload content is not uploaded to a parsing or AI service;
- Monaco, fonts, workers, and PWA assets are bundled locally;
- analytics are opt-in and disabled by default;
- Webvisor/clickmap session recording is disabled.

When analytics are enabled, DataTree only sends anonymous product usage events such as page views and feature actions. Payload content is never sent.

## Why Not Just AI?

AI is useful for explanations, but payload work often needs deterministic tooling:

- instant local parsing for large or sensitive payloads;
- repeatable schema/type generation;
- exact JSONPath/XPath extraction;
- semantic diff reports that can be copied into PRs;
- redaction before anything is shared;
- offline use during debugging, incidents, and private client work.

DataTree is the tool you use before asking AI, or instead of AI when the task is mechanical, sensitive, or needs exact output.

## Quality Gates

```bash
npm run type-check
npm run lint
npm run test:unit:run
npm run test:performance
npm run test:smoke
npm run build
```

`npm run quality` runs type-check, lint, unit tests, and build.

Current coverage includes:

- schema/type/Zod generation tests;
- AJV JSON Schema validation tests;
- semantic diff tests;
- transform tests for XML, CSV, redaction, and codegen;
- performance tests for large parse/transform/stats plus insights/query;
- product smoke tests for Inspect, Validate, Compare, Transform engines;
- PWA asset/config smoke checks.

## Development

```bash
git clone https://github.com/zapaza/DataTree.git
cd datatree
npm install
npm run dev
```

## Tech Stack

- Vue 3, Vite, TypeScript, Pinia;
- Monaco Editor;
- UnoCSS and Carbon icons;
- Web Workers for parsing, filtering, and diffing;
- AJV, Zod, fast-xml-parser;
- Vitest and Vue Test Utils;
- Vite PWA.

## License

MIT © 2026 DataTree Team
