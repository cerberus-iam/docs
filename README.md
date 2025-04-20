# Cerberus IAM - Documentation Site

Comprehensive, versioned documentation for the Cerberus Identity & Access Management (IAM) platform, delivered as a static website via VitePress. This repository includes source content, configuration, and tooling to author, preview, lint, and build the documentation.

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Project Overview](#project-overview)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development Server](#development-server)
- [Available Commands](#available-commands)
- [Configuration](#configuration)
  - [VitePress](#vitepress)
  - [TypeScript](#typescript)
  - [ESLint \& Prettier](#eslint--prettier)
- [Authoring Guidelines](#authoring-guidelines)
- [Contributing](#contributing)
- [Legal](#legal)

## Project Overview

The Cerberus IAM Documentation Site provides end‑to‑end guidance for developers integrating with the Cerberus IAM API. It leverages VitePress for fast, client‑side hot‑reload during authoring and produces a fully static website for production deployment. All content is authored in Markdown with optional Vue components for interactive examples.

## Repository Structure

```
.
├── .vitepress/               VitePress configuration and theme overrides
│   ├── config.ts             Site metadata, navigation, sidebar and plugins
│   └── theme/                Custom layouts, components and styles
├── src/                      Primary documentation source files
│   ├── authentication/       Authentication flows and examples
│   ├── invitations/          Invitation management API reference
│   ├── organisations/        Multi‑tenant configuration guide
│   ├── sdk/                  Laravel SDK reference and usage
│   ├── teams/                Team‑management API reference
│   ├── users/                User‑resource reference and examples
│   ├── examples.md           Code samples and end‑to‑end walkthroughs
│   ├── getting-started.md    Quickstart and installation instructions
│   ├── index.md              Documentation homepage and overview
│   └── rate-limits.md        API rate‑limiting policies
├── package.json              Project metadata, dependencies, scripts, lint/format configuration
└── tsconfig.json             TypeScript compiler options for `.ts`, `.vue`, and `.md` files
```

## Getting Started

### Prerequisites

- **Node.js** (LTS recommended)
- **npm** (v8+)

### Installation

```bash
git clone git@github.com:your-org/cerberus-docs.git
cd cerberus-docs
npm install
```

### Development Server

```bash
npm run docs:dev
```

By default, VitePress serves content at `http://localhost:3000`. Changes to `.md`, `.vue`, and configuration files in `src/` or `.vitepress/` will reload automatically.

## Available Commands

| Command                 | Description                                           |
| ----------------------- | ----------------------------------------------------- |
| `npm run docs:dev`      | Start VitePress in development mode                   |
| `npm run docs:build`    | Build static files into the `dist/` directory         |
| `npm run docs:preview`  | Preview the production build on a local server        |
| `npm run lint`          | Lint all `.js`, `.ts`, `.vue`, and `.md` files        |
| `npm run lint:fix`      | Lint and automatically fix fixable issues             |
| `npm run format`        | Apply Prettier formatting to all source files         |

## Configuration

### VitePress

- **`.vitepress/config.ts`**: Defines site title, description, navigation, sidebar structure, and plugin integrations.
- **`.vitepress/theme/`**: Contains custom Vue components, layouts, and styling overrides.

### TypeScript

- **`tsconfig.json`**: Configures the TypeScript compiler to support `.ts`, `.vue`, and `.md` imports, enforces strict type‑checking, and resolves path aliases (`@/* → src/*`).

### ESLint & Prettier

Linting and formatting are configured in **`package.json`**:

- **ESLint** is extended with recommended rules for TypeScript and Vue, with MDX support for Markdown files.
- **Prettier** enforces a consistent code style across Markdown, Vue, and code snippets.
- Scripts are provided to lint, fix, and format the entire codebase.

## Authoring Guidelines

1. Create or update Markdown files under the appropriate `src/` directory.
2. (Optional) Add YAML front matter for page metadata:

   ```yaml
   ---
   title: "Your Page Title"
   ---
   ```

3. Use relative links for navigation between pages:

   ```markdown
   [Getting Started](./getting-started.md)
   ```

4. Include fenced code blocks for examples, specifying the language:

   ```ts
   import { Cerberus } from '@/sdk'
   ```

5. Leverage Vue components in Markdown to demonstrate interactive samples where necessary.

## Contributing

1. Fork the repository and create a feature branch.
2. Author your changes in `src/` or update configuration in `.vitepress/`.
3. Run linting and formatting:

   ```bash
   npm run lint:fix && npm run format
   ```

4. Build the documentation to verify there are no errors:

   ```bash
   npm run docs:build
   ```

5. Commit your changes, push to your fork, and open a pull request.

## Legal

**© 2025 Cerberus Technologies. All rights reserved.**

This documentation is proprietary and provided exclusively to Cerberus IAM customers under the terms of your license agreement and confidentiality obligations. Unauthorized distribution or disclosure is strictly prohibited. For full legal terms, please refer to your Customer Terms of Service.
