# AGENTS.md - SiYuan Plugin Development Guide

## Project Overview
This is a SiYuan plugin project using TypeScript, Webpack, and ESLint. The project follows the official SiYuan plugin template structure.

## Build Commands

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Development mode with hot reload |
| `pnpm run build` | Production build, generates `package.zip` for marketplace |
| `pnpm run lint` | Run ESLint with auto-fix (`--fix --cache`) |

### Single Test
No test framework is configured. Tests are not required for SiYuan plugins.

## Code Style Guidelines

### General
- Language: TypeScript (target ES6, CommonJS module)
- Package manager: pnpm
- All source files in `src/` directory

### ESLint Configuration
- Config file: `eslint.config.mjs` (Flat Config)
- Uses `@typescript-eslint/recommended` rules

### Formatting Rules
```javascript
// From eslint.config.mjs
semi: [2, "always"]           // Semicolons required
quotes: [2, "double", { avoidEscape: true }]  // Double quotes
```

### TypeScript
- `tsconfig.json`: `noImplicitAny: true`, `target: "es6"`, `module: "commonjs"`
- Type imports from `siyuan` package
- Use interface types (e.g., `IMenuItem`, `Protyle`, `ICard`)

### Naming Conventions
- Classes: PascalCase (e.g., `PluginSample`)
- Constants: UPPER_SNAKE_CASE (e.g., `STORAGE_NAME`)
- Methods: camelCase
- Private methods: prefix with `private` keyword

### Plugin Structure
```typescript
import { Plugin, showMessage, Setting, fetchPost, ... } from "siyuan";

export default class PluginSample extends Plugin {
    onload() {
        // Plugin initialization
        this.addCommand({...});
        this.addTopBar({...});
        this.eventBus.on("event-name", handler);
    }

    onLayoutReady() {
        // Called when layout is ready
    }

    onunload() {
        // Cleanup on unload
    }
}
```

### Error Handling
- Use `.catch()` for promises
- Display errors via `showMessage()`:
```typescript
this.saveData(key, data).catch(e => {
    showMessage(`[${this.name}] save data [${key}] fail: `, e);
});
```

### Imports
- Named imports from `siyuan` package
- Side-effect import for styles: `import "./index.scss";`
- Order: external imports → siyuan imports → local imports → styles

### i18n (Internationalization)
- Store translations in `src/i18n/*.json` (e.g., `en_US.json`, `zh_CN.json`)
- Access via `this.i18n.keyName`
- Required for marketplace: at least English (default) and Chinese (zh_CN)

### Plugin Configuration
- `plugin.json`: metadata, version, backends, frontends, displayName, description
- Follow semver for version numbers
- `minAppVersion`: minimum SiYuan version (e.g., "3.5.10")

## Translator Plugin Development

For building a translator plugin, use the official template:
```
siyuan-community/siyuan-plugin-template
```

### Context Menu Integration
```typescript
this.eventBus.on("click-editorcontent", ({detail}) => {
    const menu = detail.menu as Menu;
    const selectedText = window.getSelection()?.toString();
    if (selectedText) {
        menu.addItem({
            icon: "iconTranslate",
            label: this.i18n.translate,
            click: () => this.translateText(selectedText)
        });
    }
});
```

### Translation API (LibreTranslate)
```typescript
async translateText(text: string): Promise<string> {
    const response = await fetch("http://localhost:5000/translate", {
        method: "POST",
        body: JSON.stringify({
            q: text,
            source: "auto",
            target: "ru",
            format: "text"
        }),
        headers: { "Content-Type": "application/json" }
    });
    const data = await response.json();
    return data.translatedText;
}
```

### Additional APIs
- `this.pushMsg(message, duration)` - Show notification
- `this.addCommand({langKey, hotkey, callback})` - Add hotkey command
- `this.saveData(key, data)` / `this.loadData(key)` - Persist data
- Use kernel APIs (`/api/file/*`) for file operations, NOT `fs` directly

## Development Workflow
1. Clone template or use this project as base
2. Run `pnpm i` to install dependencies
3. Run `pnpm run dev` for development
4. Place plugin folder in `{workspace}/data/plugins/`
5. Enable in SiYuan marketplace → downloaded
6. Build with `pnpm run build` for release

## Required Files
- `plugin.json` - Plugin metadata
- `src/index.ts` - Main entry point
- `src/index.scss` - Styles (optional)
- `src/i18n/en_US.json` - English translations
- `src/i18n/zh_CN.json` - Chinese translations
- `icon.png` - Plugin icon (160x160, max 20KB)
- `preview.png` - Preview image (1024x768, max 200KB)
- `README.md` - English documentation
- `README_zh_CN.md` - Chinese documentation

## Release Process
1. Update version in `plugin.json` (follow semver)
2. Run `pnpm run build` to generate `package.zip`
3. Create GitHub release with version as tag
4. Upload `package.zip` as release asset
5. Submit PR to bazaar repository (first release only)

## Best Practices
- Always handle async errors with try-catch and `.catch()`
- Use `this.data` for plugin-specific storage
- Register cleanup in `onunload()` to prevent memory leaks
- Unregister event listeners in `onunload()`: `this.eventBus.off("event", handler)`
- Use SiYuan kernel APIs (`/api/*`) instead of direct file system access
- Support both desktop and mobile frontends when possible
- Test on multiple platforms: Windows, Linux, macOS, iOS, Android
