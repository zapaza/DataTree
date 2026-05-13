# DataTree - Professional JSON/XML Visualizer & Diff Tool

![Version](https://img.shields.io/badge/version-0.1.0--alpha-blue)
![Vue](https://img.shields.io/badge/vue-3.5-green)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

Professional tool for visualizing, analyzing, and comparing JSON and XML structures directly in the browser. Built using modern technologies and focused on performance and developer convenience.

**Live Demo:** [datatree.space-dev.tech](https://datatree.space-dev.tech)

![DataTree Interface](./public/d08d4c58df1545545114323379e35313_1767894518.png)

## ✨ Features

### 🔍 Core Functionality
- **Syntax Highlighting** for JSON and XML based on Monaco Editor.
- **Tree View** with virtualization for instant rendering of large structures.
- **Comparison Engine (Diff)**: Compare two JSON/XML files with structural analysis.
- **Format Auto-detection** and on-the-fly validation.
- **Search** through keys and values with automatic scrolling to results.
- **Path Copying** in JS, JSONPath, and XPath formats.

### ⚖️ Comparison (Diff) Engine
- **LCS Algorithm**: Optimized Longest Common Subsequence for accurate structural diffing.
- **Performance**: High-speed comparison with DP and fast-path fallbacks for large files.
- **Side-by-Side View**: Dual-editor interface with synchronized scrolling and change highlighting.
- **Diff Tree**: Specialized tree view to visualize structural additions, removals, and modifications.
- **Export Formats**: Export comparison results as JSON Patch (RFC 6902), CSV, Unified Diff, or a self-contained HTML report.
- **Lazy Loading**: Smooth UI even with thousands of detected changes.

### 🔧 Tools and Transformations
- **Conversion** between JSON and XML while preserving structure.
- **Formatting and Minification** of JSON.
- **Schema Validation** (Simple Zod-like schema).
- **Intelligent Auto-fix** for common JSON errors.
- **Document Statistics**: node count, depth, type distribution, and parsing time.

### ⚡ Performance and Offline
- **Local-only Processing**: JSON/XML content is parsed, visualized, transformed, and stored in your browser.
- **Web Workers**: Parsing and Diffing are performed in background threads to keep the UI responsive.
- **Smart Caching**: In-memory caching for diff results to ensure instant navigation.
- **Virtual Scrolling**: Smooth operation with data up to 10 MB (600k+ nodes).
- **PWA**: Ability to install on desktop and full offline operation.
- **Operation History**: Automatic state saving in IndexedDB for both editor and diff sessions.

## 🛠 Technologies
- **Vue 3** (Composition API, `<script setup>`)
- **Vite** — ultra-fast build tool
- **Pinia** — centralized state management
- **Monaco Editor** — powerful code editor
- **UnoCSS** — atomic CSS engine with Carbon and Icons presets
- **Vitest** — unit and performance testing
- **fast-xml-parser** — fast XML processing
- **zod** — schema validation

## 🚀 Quick Start

### Online Usage
1. Open [datatree.space-dev.tech](https://datatree.space-dev.tech)
2. Paste text or drag a file into the editor area.
3. Explore the structure in the visualizer on the right.

### Development
```bash
# Clone the repository
git clone https://github.com/zapaza/DataTree.git
cd datatree

# Install dependencies
npm install

# Start dev server
npm run dev

# Type check
npm run type-check

# Build and optimize
npm run build
```

## 📈 Analytics and Privacy
DataTree is local-first: your JSON/XML payloads are processed in the browser and are not uploaded to a server for parsing, visualization, diffing, conversion, or history storage.

Analytics are opt-in and disabled by default. If enabled in Settings, DataTree loads Yandex Metrica only for anonymous product usage events such as page views and feature actions. Payload content is never sent, and Webvisor/clickmap session recording is disabled.

## 📄 License
MIT © 2026 DataTree Team
