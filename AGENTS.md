# LibreTranslate SiYuan Plugin - Agent Guidelines

## Build Commands

```bash
pnpm run dev    # Development mode with watch
pnpm run build  # Production build
pnpm run lint   # Run ESLint
```

- **Single test**: No test framework configured

## Version Format

Use semantic versioning:
- `0.0.x` - bug fixes
- `0.x.0` - new features
- `x.0.0` - major changes

Current version: `0.1.1`

## Project Structure

```
src/
├── index.ts          # Main plugin class (ALL code in one file)
├── index.scss        # Styles
├── lib/
│   └── translator.ts # LibreTranslate API client
└── i18n/
    ├── en_US.json    # English translations
    └── zh_CN.json    # Chinese translations
```

## Code Style Guidelines (SiYuan Plugin Patterns)

### 1. Setting API (CRITICAL)

Follow the official plugin-sample pattern exactly:

```typescript
// CORRECT - create element as local variable, use inside createActionElement
private initSettings(): void {
    const apiUrlInput = document.createElement("input");
    
    this.setting = new Setting({
        confirmCallback: () => {
            this.saveSettings(apiUrlInput); // pass element reference
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
}
```

**Key rules:**
- Create element as LOCAL variable in initSettings()
- Reference element INSIDE createActionElement()
- Pass elements to saveSettings() via parameters
- Use `this.data[STORAGE_NAME]` for reading data
- Use `this.saveData(STORAGE_NAME, data)` in confirmCallback
- Initialize `this.setting` in `onload()` method

### 2. Data Storage Pattern

```typescript
const STORAGE_NAME = "config";

class MyPlugin extends Plugin {
    async onload() {
        // Initialize with default data
        this.data[STORAGE_NAME] = {key: "defaultValue"};
        
        // Load from storage AFTER initializing defaults
        await this.loadData(STORAGE_NAME).catch(e => {
            console.log(`[${this.name}] load data [${STORAGE_NAME}] fail: `, e);
        });
    }
}
```

### 3. Version Logging

```typescript
const PLUGIN_VERSION = "0.1.1";

async onLayoutReady() {
    console.log(`[${this.name}] loaded version ${PLUGIN_VERSION}`);
}
```

### 4. Dialog Pattern

```typescript
const dialog = new Dialog({
    title: "Title",
    width: "600px",
    content: `<div class="b3-dialog__content">Content</div>`
});
```

### 5. Menu Pattern

```typescript
const menu = new Menu("menuId", () => {/* close callback */});
menu.addItem({
    icon: "iconName",
    label: "Label",
    click: () => { /* action */ }
});
menu.open({x: rect.right, y: rect.bottom});
```

### 6. Event Bus Pattern

```typescript
// Bind in constructor
this.boundHandler = this.handler.bind(this);

onload() {
    this.eventBus.on("event-name", this.boundHandler);
}

onunload() {
    this.eventBus.off("event-name", this.boundHandler);
}
```

### 7. Top Bar Pattern

```typescript
this.addTopBar({
    icon: "iconId",
    title: this.i18n.labelKey,
    position: "right",
    callback: () => { /* action */ }
});
```

### 8. i18n Usage

- Use `this.i18n.key` for all user-facing strings
- Define translations in `src/i18n/*.json`
- Fallback to English if key not found

### 9. Error Handling

```typescript
try {
    // async operation
} catch (e: any) {
    showMessage(`[${this.name}] error: ${e.message}`, 5000, "error");
}
```

### 10. Protyle Operations

```typescript
const doOperations: IOperation[] = [];
doOperations.push({
    id: blockId,
    data: element.outerHTML,
    action: "update"
});
protyle.getInstance().transaction(doOperations);
```

## Common Issues to Avoid

1. **Don't create custom openSetting()** - Use built-in `this.setting` API
2. **Don't use loadData() in constructor** - Use in `onload()` or `onLayoutReady()`
3. **Don't forget to bind event handlers** - Use `.bind(this)` or assign in constructor
4. **Don't use await without try-catch** - Always handle errors
5. **Don't access elements immediately** - Use setTimeout or wait for DOM
6. **Don't create elements as class properties** - Use local variables in initSettings()

## Imports

Always import from "siyuan":
```typescript
import {Plugin, showMessage, Dialog, Menu, Setting, fetchPost, Protyle, IOperation, getAllEditor} from "siyuan";
```

## Naming Conventions

- Class names: PascalCase (e.g., `LibreTranslatePlugin`)
- Interfaces: PascalCase (e.g., `PluginSettings`)
- Methods: camelCase
- Constants: UPPER_SNAKE_CASE (e.g., `STORAGE_NAME`, `PLUGIN_VERSION`)
- CSS classes: BEM-like with double underscore (e.g., `block__element`)

## Key SiYuan API Classes

- `Plugin` - Main plugin class
- `Setting` - Settings panel API
- `Dialog` - Modal dialogs
- `Menu` - Context menus
- `Protyle` - Editor instance
- `IOperation` - Editor transaction operations

## CSS Classes Reference

Use SiYuan's built-in CSS classes:
- `b3-text-field` - Input fields
- `b3-select` - Dropdowns
- `b3-button` - Buttons
- `b3-button--primary` - Primary button
- `b3-button--outline` - Outline button
- `fn__block` - Block display
- `fn__flex` - Flexbox
- `fn__margin-top` - Margin top