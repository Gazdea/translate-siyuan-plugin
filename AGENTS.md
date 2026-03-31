# LibreTranslate SiYuan Plugin - Agent Guidelines

## Overview

SiYuan plugin for LibreTranslate integration. Translates selected text or blocks via dialog with multi-language support.

## Build & Development Commands

```bash
pnpm install      # Install dependencies
pnpm run dev     # Development mode (watch, builds to dist/)
pnpm run build   # Production build (minified, outputs dist/)
pnpm run lint    # Run ESLint with auto-fix
```

**No test framework configured** - no `npm test` available.

---

## Code Style & Conventions

### Imports & Modules

```typescript
// Order: 1) Built-in modules, 2) External libs, 3) SiYuan core, 4) Internal files
import path from "node:path";
import { Plugin, Menu, showMessage } from "siyuan";
import { LibreTranslate } from "./lib/translator";
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `data-service.ts` |
| Classes | PascalCase | `LibreTranslatePlugin` |
| Functions/Vars | camelCase | `openTranslateDialog()` |
| Constants | UPPER_SNAKE_CASE | `STORAGE_NAME` |
| CSS Classes | Prefix with plugin | `.translate-plugin__button` |

### Type Safety

- **No `any`**: Use `unknown` or define specific interfaces
- **Interfaces over types**: Prefer `interface` for public APIs
- **Null checks**: Use optional chaining (`?.`) and nullish coalescing (`??`)

```typescript
// Good
interface TranslateOptions {
    text: string;
    source?: string;
    target: string;
}

// Avoid
const data: any = getData();
```

### Error Handling

- **API calls**: Always wrap in try-catch
- **User feedback**: Use `showMessage()` for errors (2-3 second timeout)
- **Graceful degradation**: If feature fails, plugin remains functional

```typescript
try {
    const result = await this.translator.translate(options);
} catch (error) {
    showMessage(`[${this.name}] ${error}`, 3000, "error");
    console.error("[Translate] Error:", error);
}
```

---

## SiYuan Implementation Rules

### Lifecycle Integrity

| Method | Purpose |
|--------|---------|
| `constructor()` | Bind event handlers (`this.handler = this.handler.bind(this)`) |
| `onload()` | Registration only - icons, topbar, commands, settings. No heavy operations |
| `onLayoutReady()` | UI interactions, data loading |
| `onunload()` | **Mandatory cleanup**: removeEventListener, clearInterval, destroy elements |
| `uninstall()` | Remove stored data |

```typescript
class MyPlugin extends Plugin {
    constructor(app: App) {
        super(app);
        this.boundHandler = this.handleClick.bind(this);
    }

    async onload() {
        this.addTopBar({ icon: "iconTranslate", title: this.i18n.translate });
    }

    onunload() {
        this.eventBus.off("click-editorcontent", this.boundHandler);
    }
}
```

### Data Management

```typescript
const STORAGE_NAME = "config";

async onload() {
    // 1. Initialize defaults FIRST
    this.data[STORAGE_NAME] = { apiUrl: "http://localhost:5000", apiKey: "" };
    
    // 2. Load from storage (merges with defaults)
    await this.loadData(STORAGE_NAME).catch(e => console.error(e));
}

async saveSettings(data: PluginSettings) {
    this.data[STORAGE_NAME] = data;
    await this.saveData(STORAGE_NAME, data);
}
```

### Settings API Pattern

**Critical**: Create form elements as LOCAL variables in `initSettings()`, NOT inside `createActionElement()`.

```typescript
private initSettings(): void {
    const inputElement = document.createElement("input");
    inputElement.className = "b3-text-field fn__block";
    
    this.setting = new Setting({
        confirmCallback: () => {
            this.saveData(STORAGE_NAME, { url: inputElement.value });
        }
    });
    
    this.setting.addItem({
        title: "API URL",
        createActionElement: () => {
            inputElement.value = this.data[STORAGE_NAME].url;
            return inputElement;
        }
    });
}
```

### Internationalization (i18n)

- **No hardcoding**: All UI strings in `src/i18n/en_US.json` / `zh_CN.json`
- **Usage**: `this.i18n.keyName`
- **Fallback**: Missing keys fall back to English

---

## Project Structure

```
src/
├── index.ts           # Main plugin class + TranslateDialog
├── index.scss         # SCSS styles
├── lib/
│   └── translator.ts  # LibreTranslate API client
└── i18n/
    ├── en_US.json     # English translations
    └── zh_CN.json     # Chinese translations
dist/                  # Build output (generated)
```

---

## CSS Classes Reference

Use SiYuan built-in classes to match theme:

| Class | Usage |
|-------|-------|
| `b3-text-field` | Input fields |
| `b3-select` | Dropdowns |
| `b3-button` | Buttons |
| `b3-button--primary` | Primary button |
| `b3-button--outline` | Outline button |
| `fn__block` | Block display |
| `fn__flex` | Flexbox |
| `fn__flex-1` | Flex grow |

---

## Critical Constraints

- **Mobile awareness**: Check `getFrontend()` for mobile before hover events
- **Performance**: Users may have 100k+ blocks - avoid blocking main thread
- **No globals**: Do not attach to `window` unless necessary
- **Versioning**: Follow semver - update both `package.json` and `plugin.json`

---

## Workflow

1. Read AGENTS.md before making changes
2. Make changes to source files
3. Run `pnpm run lint` to check code style
4. Run `pnpm run dev` to test
5. Run `pnpm run build` for release
6. Update version in `plugin.json` and `package.json`