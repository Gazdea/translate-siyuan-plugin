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
├── LICENSE              # License file
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
│   ├── README_zh_CN.md
│   └── i18n/
│       ├── en_US.json
│       └── zh_CN.json
└── node_modules/
```

## Version

Current: `0.1.1`

Use semantic versioning:
- `0.0.x` - bug fixes
- `0.x.0` - new features
- `x.0.0` - major changes

---

# PART 1: PLUGIN-SAMPLE REFERENCE (Complete SiYuan Plugin API)

The following sections document ALL aspects of the SiYuan plugin system based on plugin-sample and petal API.

---

## Lifecycle Methods

The plugin has a specific lifecycle that must be followed:

```typescript
class MyPlugin extends Plugin {
    constructor(app: App) {
        super(app);
        // Bind event handlers here
        this.boundHandler = this.handler.bind(this);
    }

    onload() {
        // Called when plugin is loaded
        // 1. Initialize data defaults
        // 2. Load stored data
        // 3. Add icons, topbar, docks, tabs
        // 4. Register event listeners
        // 5. Initialize settings
    }

    onLayoutReady() {
        // Called when layout is ready (UI is rendered)
        // Use for operations that require UI elements
    }

    onunload() {
        // Called when plugin is disabled
        // Unregister event listeners
    }

    uninstall() {
        // Called when plugin is uninstalled
        // Remove stored data
    }

    onDataChanged() {
        // Called when stored data changes
        // Can auto-disable/re-enable plugin
    }
}
```

---

## Data Storage

```typescript
const STORAGE_NAME = "config";

class MyPlugin extends Plugin {
    async onload() {
        // 1. Initialize with defaults FIRST
        this.data[STORAGE_NAME] = {
            apiUrl: "http://localhost:5000",
            apiKey: "",
            sourceLang: "auto",
            targetLang: "en"
        };

        // 2. Load from storage (merges with defaults)
        await this.loadData(STORAGE_NAME).catch(e => {
            console.log(`[${this.name}] load data fail:`, e);
        });

        // 3. Use stored data
        const settings = this.data[STORAGE_NAME];
    }

    async saveSettings(newData) {
        // Update in-memory data
        this.data[STORAGE_NAME] = newData;

        // Persist to storage
        await this.saveData(STORAGE_NAME, newData);
    }

    async uninstall() {
        // Clean up stored data
        await this.removeData(STORAGE_NAME);
    }
}
```

---

## Settings API (Setting Class)

The Setting class manages plugin configuration in SiYuan settings panel.

**Correct Pattern (from plugin-sample)**:
```typescript
class MyPlugin extends Plugin {
    private initSettings(): void {
        // CRITICAL: Create elements as LOCAL variables
        const textareaElement = document.createElement("textarea");
        
        this.setting = new Setting({
            confirmCallback: () => {
                // Save data when user clicks "Confirm"
                this.saveData(STORAGE_NAME, {
                    readonlyText: textareaElement.value
                }).catch(e => {
                    showMessage(`[${this.name}] save fail:`, e);
                });
            }
        });

        this.setting.addItem({
            title: "Setting Title",
            direction: "row",  // or "column"
            description: "Setting description",
            createActionElement: () => {
                // Configure and return the element
                textareaElement.className = "b3-text-field fn__block";
                textareaElement.value = this.data[STORAGE_NAME].someField;
                return textareaElement;
            }
        });

        // For buttons that don't need input
        const btnElement = document.createElement("button");
        btnElement.className = "b3-button b3-button--outline";
        btnElement.textContent = "Click Me";
        btnElement.addEventListener("click", () => {
            // Action
        });
        
        this.setting.addItem({
            title: "Action",
            actionElement: btnElement,
        });
    }
}
```

**Key Rules**:
1. Create form elements as LOCAL variables in `initSettings()`
2. Use `createActionElement()` only to configure and return element
3. Pass element reference to save function via closure or parameters
4. Use `this.data[STORAGE_NAME]` for reading initial values
5. Initialize `this.setting` only once

---

## Top Bar

Add buttons to the top bar:

```typescript
this.addTopBar({
    icon: "iconFace",      // SVG id or full SVG tag
    title: this.i18n.addTopBarIcon,  // Tooltip
    position: "right",     // "left" or "right"
    callback: (event: MouseEvent) => {
        // Handle click
    }
});
```

---

## Status Bar

Add elements to the status bar:

```typescript
const statusElement = document.createElement("div");
statusElement.className = "toolbar__item";
statusElement.textContent = "Status";
statusElement.addEventListener("click", () => {
    // Handle click
});

this.addStatusBar({
    element: statusElement,
    position: "right"  // or "left"
});
```

---

## Icons (SVG)

Add custom SVG icons:

```typescript
this.addIcons(`
<symbol id="iconMyPlugin" viewBox="0 0 32 32">
    <path d="M16 3C8.832 3 3 8.832 3 16..."/>
</symbol>
<symbol id="iconSaving" viewBox="0 0 32 32">
    <path d="M20 13.333..."/>
</symbol>
`);
```

---

## Commands (Hotkeys)

Register keyboard commands:

```typescript
this.addCommand({
    langKey: "showDialog",      // i18n key
    hotkey: "⇧⌘O",              // Mac-style hotkey
    callback: () => {
        this.showDialog();
    }
});

// With different callbacks based on context
this.addCommand({
    langKey: "getTab",
    hotkey: "⇧⌘M",
    globalCallback: () => { /* app not focused */ },
    fileTreeCallback: (files) => { /* focus on file tree */ },
    editorCallback: (protyle) => { /* focus on editor */ },
    dockCallback: (element) => { /* focus on dock */ },
});
```

**Hotkey Format** (Mac symbols):
- ⌘ = Ctrl (or Command on Mac)
- ⇧ = Shift
- ⌥ = Alt
- ⇥ = Tab
- ⌫ = Backspace
- ⌦ = Delete
- ↩ = Enter

---

## Custom Tabs

Create custom tab content:

```typescript
const TAB_TYPE = "custom_tab";

this.custom = this.addTab({
    type: TAB_TYPE,
    init() {
        this.element.innerHTML = `<div>${this.data.text}</div>`;
    },
    beforeDestroy() {
        console.log("before destroy");
    },
    destroy() {
        console.log("destroy");
    },
    resize() {
        console.log("resize");
    },
    update() {
        console.log("update");
    }
});
```

Open custom tab:
```typescript
openTab({
    app: this.app,
    custom: {
        id: this.name + TAB_TYPE,
        icon: "iconFace",
        title: "Custom Tab",
        data: { text: "Hello" }
    }
});
```

---

## Docks

Create dock panels:

```typescript
const DOCK_TYPE = "dock_tab";

this.addDock({
    config: {
        position: "LeftBottom",  // "LeftTop" | "LeftBottom" | "RightTop" | "RightBottom" | "BottomLeft" | "BottomRight"
        size: { width: 200, height: 0 },
        icon: "iconSaving",
        title: "Custom Dock",
        hotkey: "⌥⌘W",
    },
    data: {
        text: "Dock content"
    },
    type: DOCK_TYPE,
    init: (dock) => {
        dock.element.innerHTML = `<div class="fn__flex-1">${dock.data.text}</div>`;
    },
    destroy() {
        console.log("destroy dock");
    },
    resize() {
        console.log("resize dock");
    },
    update() {
        console.log("update dock");
    }
});
```

---

## Event Bus (Events)

Subscribe to SiYuan events:

```typescript
// Bind in constructor for proper cleanup
this.blockIconEventBindThis = this.blockIconEvent.bind(this);

onload() {
    // Editor events
    this.eventBus.on("click-editorcontent", this.handleClick);
    this.eventBus.on("click-blockicon", this.blockIconEventBindThis);
    this.eventBus.on("click-editortitleicon", this.handleEvent);
    this.eventBus.on("click-pdf", this.handleEvent);
    
    // Protyle lifecycle
    this.eventBus.on("loaded-protyle-static", this.handleEvent);
    this.eventBus.on("loaded-protyle-dynamic", this.handleEvent);
    this.eventBus.on("switch-protyle", this.handleEvent);
    this.eventBus.on("destroy-protyle", this.handleEvent);
    
    // Menu events
    this.eventBus.on("open-menu-doctree", this.handleEvent);
    this.eventBus.on("open-menu-blockref", this.handleEvent);
    this.eventBus.on("open-menu-link", this.handleEvent);
    this.eventBus.on("open-menu-image", this.handleEvent);
    this.eventBus.on("open-menu-tag", this.handleEvent);
    this.eventBus.on("open-menu-av", this.handleEvent);
    this.eventBus.on("open-menu-content", this.handleEvent);
    
    // Paste event (can modify pasted content)
    this.eventBus.on("paste", this.handlePaste);
    
    // Search
    this.eventBus.on("input-search", this.handleEvent);
    
    // WebSocket
    this.eventBus.on("ws-main", this.handleEvent);
    
    // Notebook
    this.eventBus.on("opened-notebook", this.handleEvent);
    this.eventBus.on("closed-notebook", this.handleEvent);
    
    // URL protocol
    this.eventBus.on("open-siyuan-url-plugin", this.handleEvent);
    this.eventBus.on("open-siyuan-url-block", this.handleEvent);
}

onunload() {
    // MUST unsubscribe from all events
    this.eventBus.off("click-editorcontent", this.handleClick);
    this.eventBus.off("click-blockicon", this.blockIconEventBindThis);
    // ... all other events
}
```

**Event Detail Types**:
```typescript
// click-editorcontent
{ protyle: IProtyle, event: MouseEvent }

// click-blockicon
{ menu: subMenu, protyle: IProtyle, blockElements: HTMLElement[] }

// click-editortitleicon
{ menu: subMenu, protyle: IProtyle, data: IGetDocInfo }

// paste
{ 
    protyle: IProtyle,
    resolve: (value) => void,
    textHTML: string,
    textPlain: string,
    siyuanHTML: string,
    files: FileList | DataTransferItemList
}

// ws-main
{ cmd: string, data: any, msg: string, code: number }

// switch-protyle
{ protyle: IProtyle }
```

---

## Context Menu

Add items to context menus:

```typescript
private handleClickEditorContent(event: any): void {
    const detail = event.detail;
    const menu = detail.menu as Menu;
    
    menu.addItem({
        id: "my-plugin-item",
        icon: "iconFace",           // or iconHTML for custom
        label: this.i18n.translate,
        click: () => {
            // Action
        }
    });
}
```

---

## Dialog

Create modal dialogs:

```typescript
const dialog = new Dialog({
    title: "Dialog Title",
    width: "80%",
    maxWidth: "900px",
    height: "70vh",
    content: `<div class="b3-dialog__content">
        <div>Content here</div>
    </div>`,
    destroyCallback: () => {
        // Cleanup
    }
});

// Bind input (Enter key)
dialog.bindInput(inputElement, () => {
    // Handle Enter
});

// Get elements
dialog.element.querySelector("#elementId");
```

---

## Menu

Create context menus:

```typescript
const menu = new Menu("menuId", () => {
    // Close callback
});

menu.addItem({
    icon: "iconSettings",
    label: "Open Setting",
    click: () => {
        openSetting(this.app);
    }
});

menu.addItem({
    label: "Submenu",
    type: "submenu",
    submenu: [
        { icon: "icon1", label: "Item 1", click: () => {} },
        { icon: "icon2", label: "Item 2", click: () => {} }
    ]
});

menu.addSeparator();

menu.addItem({
    label: "Readonly Item",
    type: "readonly"
});

// Desktop
menu.open({ x: rect.right, y: rect.bottom, isLeft: true });

// Mobile
menu.fullscreen();
```

---

## Editor Operations (Protyle)

Work with the SiYuan editor:

```typescript
import { getAllEditor, Protyle, IOperation } from "siyuan";

// Get current editor
const editor = getAllEditor()[0];
const protyle = editor.protyle;

// Operations
const doOperations: IOperation[] = [];

// Insert
doOperations.push({
    id: "new-block-id",
    action: "insert",
    data: "<div>...</div>",
    parentID: "parent-id",
    previousID: "previous-id"
});

// Update
doOperations.push({
    id: "block-id",
    action: "update",
    data: '<div data-node-id="block-id">New content</div>'
});

// Delete
doOperations.push({
    id: "block-id",
    action: "delete"
});

// Move
doOperations.push({
    id: "block-id",
    action: "move",
    parentID: "new-parent",
    previousID: "sibling-id"
});

// Commit transaction
protyle.getInstance().transaction(doOperations);
```

**All Operation Types**:
```typescript
type TOperation =
    | "insert"
    | "update"
    | "delete"
    | "move"
    | "foldHeading"
    | "unfoldHeading"
    | "setAttrs"
    | "updateAttrs"
    | "append"
    | "insertAttrViewBlock"
    | "removeAttrViewBlock"
    | "addAttrViewCol"
    | "removeAttrViewCol"
    | "addFlashcards"
    | "removeFlashcards"
    | "updateAttrViewCell"
    | "updateAttrViewCol"
    | "updateAttrViewColTemplate"
    | "sortAttrViewRow"
    | "sortAttrViewCol"
    | "sortAttrViewKey"
    | "setAttrViewColPin"
    | "setAttrViewColHidden"
    | "setAttrViewColWrap"
    | "setAttrViewColWidth"
    | "updateAttrViewColOptions"
    | "removeAttrViewColOption"
    | "updateAttrViewColOption"
    | "setAttrViewName"
    | "doUpdateUpdated"
    | "duplicateAttrViewKey"
    | "setAttrViewColIcon"
    | "setAttrViewFilters"
    | "setAttrViewSorts"
    | "setAttrViewColCalc"
    | "updateAttrViewColNumberFormat"
    | "replaceAttrViewBlock"
    | "addAttrViewView"
    | "setAttrViewViewName"
    | "removeAttrViewView"
    | "setAttrViewViewIcon"
    | "duplicateAttrViewView"
    | "sortAttrViewView"
    | "setAttrViewPageSize"
    | "updateAttrViewColRelation"
    | "moveOutlineHeading"
    | "updateAttrViewColRollup"
    | "hideAttrViewName"
    | "setAttrViewCardSize"
    | "setAttrViewCardAspectRatio"
    | "setAttrViewCoverFrom"
    | "setAttrViewCoverFromAssetKeyID"
    | "setAttrViewFitImage"
    | "setAttrViewShowIcon"
    | "setAttrViewWrapField"
    | "setAttrViewColDateFillCreated"
    | "setAttrViewColDateFillSpecificTime"
    | "setAttrViewViewDesc"
    | "setAttrViewColDesc"
    | "setAttrViewBlockView"
    | "setAttrViewGroup"
    | "removeAttrViewGroup"
    | "hideAttrViewAllGroups"
    | "syncAttrViewTableColWidth"
    | "hideAttrViewGroup"
    | "sortAttrViewGroup"
    | "foldAttrViewGroup"
    | "setAttrViewDisplayFieldName"
    | "setAttrViewFillColBackgroundColor"
    | "setAttrViewUpdatedIncludeTime"
    | "setAttrViewCreatedIncludeTime";
```

---

## Opening Tabs

```typescript
// Document tab
openTab({
    app: this.app,
    doc: { id: "block-id" }
});

// PDF tab
openTab({
    app: this.app,
    pdf: { path: "assets/file.pdf", page: 1 }
});

// Asset tab
openTab({
    app: this.app,
    asset: { path: "assets/image.png" }
});

// Search tab
openTab({
    app: this.app,
    search: { k: "search term" }
});

// Card tab
openTab({
    app: this.app,
    card: { type: "all" }
});

// Custom tab
openTab({
    app: this.app,
    custom: {
        id: "plugin-name-tab-type",
        icon: "iconFace",
        title: "Title",
        data: { any: "data" }
    }
});
```

---

## Utility Functions

```typescript
import { 
    showMessage,
    confirm,
    fetchPost,
    fetchGet,
    fetchSyncPost,
    openSetting,
    openAttributePanel,
    openMobileFileById,
    openWindow,
    lockScreen,
    exitSiYuan,
    saveLayout,
    getFrontend,
    getBackend,
    getAllEditor,
    getAllTabs,
    getModelByDockType,
    getActiveTab,
    getActiveEditor,
    adaptHotkey,
    globalCommand
} from "siyuan";

// Show message
showMessage("Text", 2000, "info");  // timeout, type

// Confirm dialog
confirm("Title", "Message", () => {
    // Confirm action
}, () => {
    // Cancel action
});

// API calls
fetchPost("/api/endpoint", { data: "value" }, (response) => {
    console.log(response.data);
});

// Get frontend/backend
const frontend = getFrontend();  // "desktop" | "mobile" | "browser-desktop" | etc
const backend = getBackend();     // "windows" | "linux" | "darwin" | "android" | etc

// Adapt hotkey for OS
adaptHotkey("⌘A");  // Returns "Ctrl+A" on Windows/Linux

// Open setting panel
openSetting(this.app);

// Open attribute panel
openAttributePanel({
    nodeElement: element,
    protyle: protyle,
    focusName: "bookmark"  // "bookmark" | "name" | "alias" | "memo" | "av" | "custom"
});

// Save layout
saveLayout(() => {
    showMessage("Layout saved");
});

// Lock screen
lockScreen(this.app);

// Exit application
exitSiYuan();
```

---

## Protyle Options

Customize editor toolbar and options:

```typescript
onload() {
    // Custom slash commands
    this.protyleSlash = [{
        filter: ["insert emoji 😊", "插入表情 😊"],
        html: `<div class="b3-list-item__first">${this.i18n.insertEmoji}</div>`,
        id: "insertEmoji",
        callback(protyle, nodeElement) {
            protyle.insert("😊");
        }
    }];

    // Custom toolbar
    this.protyleOptions = {
        toolbar: [
            "block-ref", "a", "|",
            "text", "strong", "em", "u", "s", "mark",
            "sup", "sub", "clear", "|",
            "code", "kbd", "tag",
            "inline-math", "inline-memo"
        ]
    };
}

// Update toolbar dynamically
updateProtyleToolbar(toolbar: Array<string | IMenuItem>) {
    toolbar.push("|");
    toolbar.push({
        name: "custom-action",
        icon: "iconEmoji",
        click(protyle) {
            protyle.insert("😊");
        }
    });
    return toolbar;
}
```

---

## Float Layer

Add backlink/reference float layer:

```typescript
this.addFloatLayer({
    refDefs: [{ refID: "block-id" }],
    x: 100,
    y: 100,
    isBacklink: false
});
```

---

## Window Management

```typescript
// Open new window
openWindow({
    doc: { id: "block-id" },
    width: 800,
    height: 600,
    position: { x: 100, y: 100 }
});

// Mobile
openMobileFileById(this.app, "block-id");
```

---

---

# PART 2: PLUGIN-SPECIFIC IMPLEMENTATION

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
- `onLayoutReady()`: Log version
- `onunload()`: Unregister event listeners
- `uninstall()`: Remove stored data

#### 2. `TranslateDialog` (standalone class)
- **Purpose**: Translation dialog UI
- **Dependencies**: Uses `LibreTranslate` from `translator.ts`
- **Lifecycle**: Created when dialog opens, destroyed on close

#### 3. `LibreTranslate` (in `lib/translator.ts`)
- **Purpose**: API client for LibreTranslate server
- **Methods**:
  - `translate(options)`: Translate text
  - `detectLanguage(text)`: Detect source language
  - `getLanguages()`: Get available languages
  - `healthCheck()`: Test server connectivity

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

## Internationalization (i18n)

**Location**: `src/i18n/en_US.json`, `src/i18n/zh_CN.json`

**Usage**: `this.i18n.keyName` in plugin code

**Current keys**:
```json
{
  "pluginName": "LibreTranslate",
  "settings": "Settings",
  "apiUrl": "API URL",
  "apiKey": "API Key",
  "sourceLang": "Source Language",
  "targetLang": "Target Language",
  "auto": "Auto Detect",
  "openTranslate": "Open Translator",
  "translate": "Translate",
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
  "languageDetected": "Detected:",
  "connectionOk": "Connection successful",
  "connectionError": "Connection failed",
  "loading": "Loading..."
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
| keywords | `translate`, `translation`, `libretranslate` | Search keywords |

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
| `toolbar__item` | Toolbar item |
| `toolbar__icon` | Toolbar icon |
| `toolbar__text` | Toolbar text |

**CSS Variables**:
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

1. **Setting API Pattern Violation**: Current code creates elements inside `createActionElement()` instead of as local variables.

2. **Duplicate Method**: `onLayoutReady()` is defined twice (lines 62-64 and 156-157).

3. **SCSS Unused**: Dialog uses inline styles instead of SCSS classes defined in `index.scss`.

4. **Language List Hardcoded**: Target language list is hardcoded in settings (6 languages) vs dialog (3 languages).

5. **No Language Fetch**: Plugin doesn't fetch available languages from server on startup.

6. **No Connection Test**: Settings don't have a "Test Connection" button despite i18n key existing.

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
- [ ] Pass elements to save function via parameters or closure
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
├── index.ts          # Plugin + TranslateDialog
├── index.scss       # Styles
├── lib/
│   └── translator.ts # API client (independent)
└── i18n/
    ├── en_US.json    # Translations
    └── zh_CN.json    # Translations
```

---

## API Reference Summary

### Plugin Class Methods

| Method | Usage |
|--------|-------|
| `onload()` | Initialize plugin |
| `onLayoutReady()` | After UI ready |
| `onunload()` | Cleanup on disable |
| `uninstall()` | Cleanup on remove |
| `addTopBar()` | Add top bar button |
| `addStatusBar()` | Add status bar element |
| `addIcons()` | Add SVG icons |
| `addTab()` | Add custom tab |
| `addDock()` | Add dock panel |
| `addCommand()` | Add hotkey command |
| `addFloatLayer()` | Add float layer |
| `loadData()` | Load stored data |
| `saveData()` | Save data |
| `removeData()` | Delete data |

### Utility Functions

| Function | Usage |
|----------|-------|
| `showMessage()` | Show toast message |
| `confirm()` | Show confirm dialog |
| `fetchPost()` | POST to API |
| `fetchGet()` | GET from API |
| `openTab()` | Open tab |
| `openSetting()` | Open settings panel |
| `openAttributePanel()` | Open attribute panel |
| `getAllEditor()` | Get editor instances |
| `getFrontend()` | Get frontend type |
| `getBackend()` | Get backend type |
| `adaptHotkey()` | Adapt hotkey to OS |

### Event Types

| Event | Description |
|-------|-------------|
| `click-editorcontent` | Click on editor content |
| `click-blockicon` | Click on block icon |
| `click-editortitleicon` | Click on title icon |
| `click-pdf` | Click on PDF |
| `loaded-protyle-static` | Static doc loaded |
| `loaded-protyle-dynamic` | Dynamic doc loaded |
| `switch-protyle` | Editor switched |
| `destroy-protyle` | Editor closed |
| `paste` | Content pasted |
| `ws-main` | WebSocket message |
| `open-menu-*` | Menu opened |