# LibreTranslate SiYuan Plugin - Agent Guidelines

## Overview
SiYuan plugin for LibreTranslate integration. Translates selected blocks via context menu using a self-hosted LibreTranslate instance. Local-first, privacy-focused, maintains Markdown integrity.

## Build & Development Commands
```bash
pnpm install      # Install dependencies
pnpm run dev      # Development mode (watch mode, outputs to dist/)
pnpm run build    # Production build (minified, outputs dist/, creates package.zip)
pnpm run lint     # Run ESLint with auto-fix
```
**No test framework configured** - no test command available.

---

## Code Style Guidelines

### ESLint Configuration
- **Quotes**: Double quotes (`"`) - no single quotes
- **Semicolons**: Always required
- **TypeScript**: Strict mode enabled (`noImplicitAny: true`), target ES6

### Imports Order
1) Built-in modules → 2) External libs → 3) SiYuan core → 4) Internal files
```typescript
import path from "node:path";
import { Plugin, Menu, showMessage } from "siyuan";
import { LibreTranslate } from "./lib/translator";
```

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `translator.ts` |
| Classes | PascalCase | `LibreTranslate` |
| Functions/Vars | camelCase | `translateBlock()` |
| Constants | UPPER_SNAKE_CASE | `STORAGE_NAME` |
| CSS Classes | Prefix with plugin | `.translate-plugin__button` |

### Type Safety
- **No `any`**: Use `unknown` or define interfaces
- Use optional chaining (`?.`) and nullish coalescing (`??`)

---

## LibreTranslate Integration

### API Endpoints
- **Translate**: `POST {serverUrl}/translate`
  ```json
  { "q": "Block Markdown Content", "source": "auto", "target": "user_selected_lang", "format": "text", "api_key": "optional_key" }
  ```
- **Languages**: `GET {serverUrl}/languages` - populate dropdowns dynamically

### TranslationService Class
```typescript
class LibreTranslate {
    private serverUrl: string;
    private apiKey: string;
    async translate(text: string, source: string, target: string): Promise<string>;
    async getLanguages(): Promise<Language[]>;
}
```

---

## SiYuan Plugin Lifecycle
| Method | Purpose |
|--------|---------|
| `constructor()` | Bind event handlers (`this.handler = this.handler.bind(this)`) |
| `onload()` | Registration only - icons, topbar, commands, settings |
| `onLayoutReady()` | UI interactions, data loading, event bus subscriptions |
| `onunload()` | **Mandatory cleanup**: removeEventListener, clearInterval, eventBus.off() |
| `uninstall()` | Remove stored data |

### Data Management
```typescript
const STORAGE_NAME = "config";
async onload() {
    this.data[STORAGE_NAME] = { apiUrl: "http://localhost:5000", apiKey: "", sourceLang: "auto", targetLang: "ru" };
    await this.loadData(STORAGE_NAME).catch(e => console.error(e));
}
```
**Critical**: Create form elements as LOCAL variables in `initSettings()`, NOT inside `createActionElement()`.

### SiYuan Kernel APIs
- **Get block**: `fetchPost("/api/block/getBlockKramdown", { id: blockId }, callback)` - returns raw Markdown with IAL
- **Update block**: `fetchPost("/api/block/updateBlock", { id: blockId, data: markdown }, callback)`
- **Notifications**: `showMessage()` for errors (3000ms), `this.pushMsg()` for status

---

## Functional Modules

### Module A: Context Menu Integration
- **Trigger**: Subscribe to `click-blockicon` event
- **Logic**:
  1. Extract `data-node-id` from selected block element
  2. Inject menu item: "🌐 Translate (LibreTranslate)"
  3. On click: Show loading state or sub-menu

### Module B: Translation Logic
- **Block-Only Mode**: Operate on entire block content, not text fragments
- **Markdown Preservation**: Use `format: "text"` to keep **bold**, *italic*, [links] intact
- **Error Handling**: If server unreachable, show "Connection Refused" message

### Module C: Action UI (Submenu/Dialog)
- **Replace**: Directly overwrite block with translated text
- **Copy**: Put translation to clipboard via `navigator.clipboard.writeText()`
- **Preview**: Show translated text as non-clickable menu label

### Module D: Settings Panel
Required fields:
- **URL**: Input for LibreTranslate server (e.g., `http://127.0.0.1:5000`)
- **API Key**: Optional password/token field
- **Source Language**: Dropdown (default: "Auto")
- **Target Language**: Dropdown (default: "Russian")

---

## Execution Flow for Agents
1. **Phase 1 (Setup)**: Define IConfig interface and initialize loadData() in onload()
2. **Phase 2 (Networking)**: Create TranslationService class with fetch requests and timeouts
3. **Phase 3 (UI)**: Implement Menu injection logic - only when one block selected
4. **Phase 4 (I18n)**: Move all strings to en_US.json and ru_RU.json (or zh_CN.json)

---

## Internationalization (i18n)
- All UI strings in `src/i18n/en_US.json` / `zh_CN.json`
- Usage: `this.i18n.keyName`
- Minimum: English (en_US) and Chinese (zh_CN)

---

## Error Handling
```typescript
try {
    const result = await translator.translate(options);
} catch (error) {
    showMessage(`[${this.name}] ${error}`, 3000, "error");
}
```
- Always wrap API calls in try-catch
- Graceful degradation: plugin remains functional if feature fails

---

## Edge Cases & Constraints
- **Large Blocks**: Warn if >5000 characters
- **Loading State**: Show "Loading..." during translation
- **Mobile**: Check `getFrontend()` before hover events
- **Markdown**: Complex LaTeX/code blocks may break - first version assumes standard Markdown

---

## Project Structure
```
src/
├── index.ts           # Main plugin class
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
| Class | Usage |
|-------|-------|
| `b3-text-field` | Input fields |
| `b3-select` | Dropdowns |
| `b3-button` | Buttons |
| `b3-button--primary` | Primary button |
| `fn__flex` | Flexbox |
| `fn__flex-1` | Flex grow |

---

## Workflow
1. Read AGENTS.md before making changes
2. Make changes to source files
3. Run `pnpm run lint` to check code style
4. Run `pnpm run dev` to test in SiYuan
5. Run `pnpm run build` for production release
6. Update version in both `package.json` and `plugin.json`