# LibreTranslate SiYuan Plugin - Agent Guidelines

## Overview

This is a SiYuan plugin that integrates LibreTranslate for text translation. The plugin allows users to translate selected text or entire blocks via a dialog, with support for multiple languages.

## Build Commands

```bash
pnpm run dev    # Development mode with watch
pnpm run build  # Production build (generates package.zip)
pnpm run lint   # Run ESLint
```

## Project Structure

```
translateSiyuanPlugin/
├── plugin.json          # Plugin metadata (name, version, author, keywords)
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── webpack.config.js    # Build configuration
├── eslint.config.mjs    # Linting rules
├── icon.png             # Plugin icon (160x160, max 20KB)
├── preview.png          # Preview image (1024x768, max 200KB)
├── README.md            # English documentation
├── README_zh_CN.md      # Chinese documentation
├── src/
│   ├── index.ts         # Main plugin class (511 lines)
│   ├── index.scss       # SCSS styles for dialog
│   ├── lib/
│   │   └── translator.ts # LibreTranslate API client (169 lines)
│   └── i18n/
│       ├── en_US.json   # English translations (44 keys)
│       └── zh_CN.json   # Chinese translations (44 keys)
├── dist/                # Built output (generated)
│   ├── index.js
│   ├── index.css
│   ├── plugin.json
│   ├── icon.png
│   ├── preview.png
│   ├── README.md
│   └── i18n/
└── node_modules/
```

## Version

Current: `0.1.1`

Use semantic versioning:
- `0.0.x` - bug fixes
- `0.x.0` - new features
- `x.0.0` - major changes

---

## Architecture

### Main Components

#### 1. `LibreTranslatePlugin` (extends Plugin)
- **Purpose**: Main plugin class
- **Key properties**:
  - `translator`: LibreTranslate API client instance
  - `translateDialog`: Current TranslateDialog instance (nullable)
  - `eventBusClickEditorContent`: Bound event handler for context menu

**Lifecycle**:
```
constructor() → onload() → onLayoutReady() → onunload() → uninstall()
```

- `onload()`: Initialize data, load settings, register icons, topbar, event listeners
- `onLayoutReady()`: Log version (DUPLICATED - see Known Issues)
- `onunload()`: Unregister event listeners
- `uninstall()`: Remove stored data

#### 2. `TranslateDialog` (standalone class)
- **Purpose**: Translation dialog UI
- **Dependencies**: Uses `LibreTranslate` from `translator.ts`
- **Lifecycle**: Created when dialog opens, destroyed on close
- **Features**:
  - Two-pane layout (source/target text)
  - Language selector dropdowns
  - Swap button
  - Translate/Clear/Copy/Replace buttons

#### 3. `LibreTranslate` (in `lib/translator.ts`)
- **Purpose**: API client for LibreTranslate server
- **Methods**:
  - `translate(options)`: Translate text
  - `detectLanguage(text)`: Detect source language
  - `getLanguages()`: Get available languages
  - `healthCheck()``: Test server connectivity

---

## Data Flow

```
User clicks topbar icon
       ↓
openTranslateDialog() → Creates TranslateDialog
       ↓
User clicks "Translate" → translator.translate()
       ↓
API returns result → Display in target textarea
       ↓
User clicks "Replace" → replaceTextInEditor()
       ↓
Find block → Update content → protyle.transaction()
```

---

## Key SiYuan API Integration Points

### 1. Plugin Base Class

```typescript
import {Plugin, showMessage, Dialog, Menu, Setting, Protyle, IOperation, getAllEditor} from "siyuan";
```
- All SiYuan APIs must be imported from "siyuan" package

### 2. Data Storage

```typescript
const STORAGE_NAME = "settings";
const DEFAULT_SETTINGS = {apiUrl: "...", apiKey: "...", sourceLang: "auto", targetLang: "en"};

// In onload()
this.data[STORAGE_NAME] = {...DEFAULT_SETTINGS};
await this.loadData(STORAGE_NAME).catch(e => {...});

// Saving
await this.saveData(STORAGE_NAME, newSettings);
```

### 3. Settings API (CRITICAL - CURRENT CODE HAS BUGS)

**CORRECT Pattern (from plugin-sample)**:
```typescript
private initSettings(): void {
    // Create elements as LOCAL variables
    const apiUrlInput = document.createElement("input");
    const apiKeyInput = document.createElement("input");
    const sourceLangSelect = document.createElement("select");
    const targetLangSelect = document.createElement("select");
    
    this.setting = new Setting({
        confirmCallback: () => {
            // Pass elements as parameters
            this.saveSettings(apiUrlInput, apiKeyInput, sourceLangSelect, targetLangSelect);
        }
    });
    
    this.setting.addItem({
        title: "API URL",
        direction: "row",
        description: "LibreTranslate server URL",
        createActionElement: () => {
            apiUrlInput.className = "b3-text-field fn__block";
            apiUrlInput.value = this.data[STORAGE_NAME].apiUrl;
            return apiUrlInput;
        }
    });
    // ... other settings
}

private saveSettings(
    apiUrlInput: HTMLInputElement,
    apiKeyInput: HTMLInputElement,
    sourceLangSelect: HTMLSelectElement,
    targetLangSelect: HTMLSelectElement
): void {
    const newSettings: PluginSettings = {
        apiUrl: apiUrlInput.value,
        apiKey: apiKeyInput.value,
        sourceLang: sourceLangSelect.value,
        targetLang: targetLangSelect.value
    };
    this.data[STORAGE_NAME] = newSettings;
    this.translator.setBaseUrl(newSettings.apiUrl);
    this.translator.setApiKey(newSettings.apiKey);
    this.saveData(STORAGE_NAME, newSettings).then(() => {
        showMessage(`[${this.name}] settings saved`, 2000);
    }).catch(e => {
        showMessage(`[${this.name}] save settings fail: ${e.message}`);
    });
}
```

**Current Code Issues**:
- ❌ Creates elements INSIDE `createActionElement()` (should be local variables)
- ❌ Uses `querySelector` in `confirmCallback` (fragile, not recommended)
- ❌ Creates new `Setting` on every `initSettings()` call (overwrites existing)

### 4. Top Bar Button

```typescript
this.addTopBar({
    icon: "iconLibreTranslate",  // Must be added via addIcons()
    title: this.i18n.openTranslate,
    position: "right",
    callback: () => this.openTranslateDialog()
});
```

### 5. Icons (SVG symbols)

```typescript
this.addIcons(`<symbol id="iconLibreTranslate" viewBox="0 0 32 32">
<path d="M16 3C8.832 3 3 8.832 3 16s5.832 13 13 13 13-5.832 13-13S23.168 3 16 3zm0 2c6.065 0 11 4.935 11 11s-4.935 11-11 11S5 22.065 5 16 9.935 5 16 5zm-4.5 5.5v2h-3v-2h3zm6 0v2h-3v-2h3zm-6 4v2h-3v-2h3zm6 0v2h-3v-2h3zm-6 4v2h-3v-2h3zm6 0v2h-3v-2h3zm-6 4v2h-3v-2h3zm6 0v2h-3v-2h3zM12 9h2v2h-2V9zm4 0h2v2h-2V9zm4 0h2v2h-2V9zM9 13h2v2H9v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-8 4h2v2H9v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zM9 21h2v2H9v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"></path>
</symbol>`);
```

### 6. Event Bus

```typescript
// Bind in constructor (CRITICAL for proper cleanup)
this.eventBusClickEditorContent = this.handleClickEditorContent.bind(this);

// Register in onload
this.eventBus.on("click-editorcontent", this.eventBusClickEditorContent);

// Unregister in onunload
this.eventBus.off("click-editorcontent", this.eventBusClickEditorContent);
```

### 7. Context Menu (click-editorcontent event)

```typescript
private handleClickEditorContent(event: any): void {
    const detail = event.detail;
    const menu = detail.menu as Menu;
    const selectedText = window.getSelection()?.toString();
    
    if (selectedText && selectedText.trim()) {
        menu.addItem({
            icon: "iconLibreTranslate",
            label: this.i18n.translate,
            click: () => this.openTranslateDialog(selectedText)
        });
    }
}
```

**When triggered**: User right-clicks on selected text in editor

### 8. Editor Text Replacement

```typescript
private async replaceTextInEditor(original: string, translated: string, protyle: Protyle | null): Promise<void> {
    // Get current selection
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    
    // Find block element containing the selection
    const startContainer = range.startContainer;
    let blockElement: HTMLElement | null = null;
    
    if (startContainer.nodeType === Node.TEXT_NODE) {
        let current: HTMLElement | null = startContainer.parentElement;
        while (current) {
            if (current.dataset.nodeId) {
                blockElement = current;
                break;
            }
            current = current.parentElement;
        }
    }
    
    if (!blockElement) {
        blockElement = protyle.wysiwyg.element.querySelector("[data-node-id]");
    }
    
    const blockId = blockElement.dataset.nodeId;
    const editElement = blockElement.querySelector('[contenteditable="true"]') as HTMLElement;
    
    if (editElement) {
        // Replace text using regex (escape special chars)
        const currentText = editElement.textContent || "";
        const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escapedOriginal, "g");
        const newText = currentText.replace(regex, translated);
        
        if (newText !== currentText) {
            editElement.textContent = newText;
            
            // Commit change to SiYuan
            const doOperations: IOperation[] = [];
            doOperations.push({
                id: blockId,
                data: editElement.outerHTML,
                action: "update"
            });
            protyle.getInstance().transaction(doOperations);
            showMessage(this.i18n.replaced);
        }
    }
}
```

### 9. Dialog

```typescript
const dialog = new Dialog({
    title: "Translate",
    width: "80%",
    maxWidth: "900px",
    height: "70vh",
    content: `<div class="b3-dialog__content">...</div>`
});
```

### 10. Menu

```typescript
const menu = new Menu("menuId", () => {/* close callback */});
menu.addItem({
    icon: "iconName",
    label: "Label",
    click: () => {/* action */}
});
// Desktop
menu.open({x: rect.right, y: rect.bottom, isLeft: true});
// Mobile
menu.fullscreen();
```

### 11. Getting Active Editor

```typescript
private getEditor() {
    const editors = getAllEditor();
    if (editors.length === 0) {
        showMessage("please open doc first");
        return;
    }
    return editors[0];  // Returns {protyle: Protyle, notebookId: string, path: string}
}
```

---

## Internationalization (i18n)

**Location**: `src/i18n/en_US.json`, `src/i18n/zh_CN.json`

**Usage**: `this.i18n.keyName` in plugin code

**Current keys** (44 total):
```json
{
  "pluginName": "LibreTranslate",
  "settings": "Settings",
  "apiUrl": "API URL",
  "apiUrlDesc": "LibreTranslate server URL",
  "apiUrlPlaceholder": "http://localhost:5000",
  "apiKey": "API Key",
  "apiKeyDesc": "Optional API key for LibreTranslate",
  "apiKeyPlaceholder": "Enter API key",
  "sourceLang": "Source Language",
  "sourceLangDesc": "Select source language or use Auto Detect",
  "targetLang": "Target Language",
  "targetLangDesc": "Select target language for translation",
  "auto": "Auto Detect",
  "testConnection": "Test Connection",
  "connectionOk": "Connection successful",
  "connectionError": "Connection failed",
  "loading": "Loading...",
  "translate": "Translate",
  "openTranslate": "Open Translator",
  "sourceText": "Source Text",
  "translatedText": "Translated Text",
  "swap": "Swap languages",
  "copy": "Copy",
  "clear": "Clear",
  "replace": "Replace in editor",
  "copied": "Copied to clipboard",
  "replaced": "Text replaced in editor",
  "error": "Error",
  "noText": "No text to translate",
  "languageDetected": "Detected:"
}
```

---

## API Interaction

### LibreTranslate Server

**Default URL**: `http://localhost:5000`

**Endpoints**:
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/translate` | POST | Translate text |
| `/detect` | POST | Detect language |
| `/languages` | GET | Get available languages |

**Request Format**:
```typescript
// translate
POST /translate
Content-Type: multipart/form-data
q=<text>&source=<lang>&target=<lang>&format=text&api_key=<key>

// detect
POST /detect
Content-Type: multipart/form-data
q=<text>&api_key=<key>

// languages
GET /languages
Authorization: Bearer <api_key>
```

**Response Format**:
```typescript
// translate
{translatedText: "string", detectedLanguage?: {confidence: number, language: string}}

// detect
[{language: "string", confidence: number}]

// languages
[{code: "string", name: "string", targets?: string[]}]
```

**Error Handling**:
```typescript
export class LibreTranslateApiError extends Error {
    public readonly userMessage: string;  // Shown to user
    public readonly serverMessage: string; // Debug info
}
```

---

## Configuration

### plugin.json Fields

| Field | Value | Notes |
|-------|-------|-------|
| name | `translate-siyuan-plugin` | Must match repo name |
| version | `0.1.1` | Semver |
| minAppVersion | `3.5.10` | Minimum SiYuan version |
| backends | `all` | Desktop + mobile |
| frontends | `all` | All frontend types |
| displayName | `LibreTranslate` | Marketplace display |
| description | Integration description | |
| keywords | `translate`, `translation`, `libretranslate` | Search keywords |
| scripts.index | `dist/index.js` | Entry point |
| styles.index | `dist/index.css` | Styles |

### Settings Stored

```typescript
interface PluginSettings {
    apiUrl: string;      // Default: "http://localhost:5000"
    apiKey: string;       // Default: ""
    sourceLang: string;   // Default: "auto"
    targetLang: string;   // Default: "en"
}
```

---

## CSS Classes Reference

Use SiYuan's built-in CSS classes:

| Class | Usage |
|-------|-------|
| `b3-text-field` | Input fields |
| `b3-select` | Dropdowns |
| `b3-button` | Buttons |
| `b3-button--primary` | Primary button |
| `b3-button--outline` | Outline button |
| `b3-button--cancel` | Cancel button |
| `b3-dialog__content` | Dialog content area |
| `b3-dialog__action` | Dialog action bar |
| `fn__block` | Block display |
| `fn__flex` | Flexbox |
| `fn__flex-center` | Flex center |
| `fn__flex-1` | Flex grow |
| `fn__space` | Space element |
| `fn__hr` | Horizontal rule |
| `fn__margin-top` | Margin top |
| `fn__spin` | Spinning animation |
| `b3-tooltips` | Tooltip |
| `b3-list-item` | List item |
| `block__icons` | Icon container |
| `block__logo` | Logo/brand |

**CSS Variables** (use for theming):
```css
var(--b3-theme-background)
var(--b3-theme-on-background)
var(--b3-theme-primary)
var(--b3-theme-on-surface)
var(--b3-theme-on-surface-light)
var(--b3-theme-success)
var(--b3-theme-error)
var(--b3-border-color)
var(--b3-card-info-background)
```

---

## Known Issues / Technical Debt

1. **Setting API Pattern Violation**: Current code creates elements inside `createActionElement()` instead of as local variables. This works but violates the official SiYuan pattern.

2. **Duplicate Method**: `onLayoutReady()` is defined twice (lines 62-64 and 156-157). The first one logs version, second is empty.

3. **SCSS Unused**: Dialog uses inline styles instead of SCSS classes defined in `index.scss`.

4. **Language List Hardcoded**: Target language list is hardcoded in two places:
   - Settings: 6 languages (en, ru, zh, es, fr, de)
   - Dialog: 3 languages (en, ru, zh)

5. **No Language Fetch**: Plugin doesn't fetch available languages from server on startup - hardcoded list only.

6. **No Connection Test**: Settings don't have a "Test Connection" button despite i18n key existing.

---

## Event Bus Events Reference

From plugin-sample, available events include:
- `click-editorcontent` - Editor content click (USED by this plugin)
- `click-blockicon` - Block icon click
- `click-pdf` - PDF click
- `switch-protyle` - Editor switch
- `destroy-protyle` - Editor close
- `loaded-protyle-static` - Static doc loaded
- `loaded-protyle-dynamic` - Dynamic doc loaded
- `paste` - Paste event (can modify pasted content)
- `open-menu-*` - Various menu events
- `input-search` - Search input
- `ws-main` - WebSocket main events
- `opened-notebook` / `closed-notebook` - Notebook events
- `open-siyuan-url-*` - URL protocol events

---

## Dependencies

From `package.json`:

| Package | Version | Purpose |
|---------|---------|---------|
| siyuan | 1.1.8 | SiYuan plugin API |
| typescript | ^5.0.0 | TypeScript |
| webpack | ^5.76.0 | Bundler |
| esbuild-loader | ^3.0.1 | JS minification |
| sass | ^1.62.1 | SCSS compilation |
| css-loader | ^6.7.1 | CSS loading |
| mini-css-extract-plugin | 2.3.0 | CSS extraction |
| copy-webpack-plugin | ^11.0.0 | File copying |
| eslint | ^9.33.0 | Linting |
| @typescript-eslint/parser | 8.40.0 | TS parsing |

---

## Workflow for Modifications

1. **Read current AGENTS.md** to understand architecture
2. **Read relevant source files** before making changes
3. **Make changes to src/index.ts, src/lib/translator.ts, or src/i18n/**
4. **Run `pnpm run dev`** to test changes in development
5. **Run `pnpm run lint`** to check code style
6. **Run `pnpm run build`** to create release package (outputs to dist/)
7. **Update version** in both `plugin.json` and `package.json` following semver

---

## Common Patterns Summary

### Correct Pattern Checklist

- [ ] Create Setting elements as local variables, not inside createActionElement
- [ ] Pass elements to save function via parameters
- [ ] Initialize defaults before loadData()
- [ ] Bind event handlers in constructor
- [ ] Unregister events in onunload()
- [ ] Use this.i18n.key for all UI strings
- [ ] Use SiYuan CSS classes (b3-*, fn__*)
- [ ] Handle errors with try-catch and showMessage()
- [ ] Use protyle.transaction() to commit editor changes

### Code Organization

```
src/
├── index.ts          # Plugin + TranslateDialog (all in one)
├── index.scss       # Styles (currently unused)
├── lib/
│   └── translator.ts # API client (independent)
└── i18n/
    ├── en_US.json    # Translations
    └── zh_CN.json    # Translations
```

For a plugin this size, keeping everything in index.ts is acceptable. If the plugin grows, consider separating TranslateDialog to its own file.