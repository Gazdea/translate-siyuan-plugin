# LibreTranslate SiYuan Plugin - Agent Guidelines

## Build Commands

```bash
pnpm run dev    # Development mode with watch
pnpm run build  # Production build
pnpm run lint   # Run ESLint
```

- **Single test**: No test framework configured

## Project Structure

```
src/
├── index.ts          # Main plugin class (ALL code in one file)
├── index.scss        # Styles (minimal, inline styles preferred)
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
// CORRECT - create element inside createActionElement
private initSettings(): void {
    const textareaElement = document.createElement("textarea");
    
    this.setting = new Setting({
        confirmCallback: () => {
            // Save data on confirm
            this.saveData(STORAGE_NAME, {value: textareaElement.value});
        }
    });
    
    this.setting.addItem({
        title: "Setting Title",
        direction: "row",
        description: "Description",
        createActionElement: () => {
            textareaElement.className = "b3-text-field fn__block";
            textareaElement.value = this.data[STORAGE_NAME].value;
            return textareaElement;
        }
    });
}
```

**Key rules:**
- Create element OUTSIDE `createActionElement`, reference it INSIDE
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
        
        // Then load from storage
        this.loadData(STORAGE_NAME).catch(e => {
            console.log(`[${this.name}] load data fail:`, e);
        });
    }
}
```

### 3. Dialog Pattern

```typescript
const dialog = new Dialog({
    title: "Title",
    width: "600px",
    content: `<div class="b3-dialog__content">Content</div>`
});
```

### 4. Menu Pattern

```typescript
const menu = new Menu("menuId", () => {/* close callback */});
menu.addItem({
    icon: "iconName",
    label: "Label",
    click: () => { /* action */ }
});
menu.open({x: rect.right, y: rect.bottom});
```

### 5. Event Bus Pattern

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

### 6. Top Bar Pattern

```typescript
this.addTopBar({
    icon: "iconId",
    title: this.i18n.labelKey,
    position: "right",
    callback: () => { /* action */ }
});
```

### 7. i18n Usage

- Use `this.i18n.key` for all user-facing strings
- Define translations in `src/i18n/*.json`
- Fallback to English if key not found

### 8. Error Handling

```typescript
try {
    // async operation
} catch (e: any) {
    showMessage(`[${this.name}] error: ${e.message}`, 5000, "error");
}
```

### 9. Protyle Operations

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

## Imports

Always import from "siyuan":
```typescript
import {Plugin, showMessage, Dialog, Menu, Setting, fetchPost, Protyle} from "siyuan";
```

## Naming Conventions

- Class names: PascalCase (e.g., `LibreTranslatePlugin`)
- Interfaces: PascalCase with "I" prefix optional (e.g., `PluginSettings`)
- Methods: camelCase
- Constants: UPPER_SNAKE_CASE
- CSS classes: BEM-like with double underscore (e.g., `block__element`)