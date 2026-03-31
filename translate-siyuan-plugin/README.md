[Russian](https://github.com/siyuan-note/plugin-sample/blob/main/README_ru_RU.md)

# LibreTranslate for SiYuan

SiYuan plugin that integrates LibreTranslate for text translation directly within the editor.

## Features

- **Multiple translation methods:**
  - Right-click context menu on selected text
  - Hotkey (Ctrl+Shift+T by default)
  - TopBar button
  - Slash command (/translate)

- **Settings:**
  - Configure LibreTranslate API URL
  - Optional API key
  - Default source/target languages
  - Customizable hotkey

- **Translation dialog:**
  - Side-by-side source and translated text
  - Language auto-detection
  - Swap languages
  - Replace original text
  - Copy to clipboard

## Requirements

- SiYuan note-taking app (version 3.5.10+)
- LibreTranslate server running locally or remotely

## Installation

### From Source

1. Clone this repository to your SiYuan plugins folder:
   ```
   {workspace}/data/plugins/translate-siyuan-plugin
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build the plugin:
   ```bash
   pnpm run build
   ```

4. Enable the plugin in SiYuan: Settings → Plugins → Downloaded

## Configuration

1. Open plugin settings from the TopBar button or plugin menu
2. Configure your LibreTranslate server URL (default: `http://localhost:5000`)
3. Optionally add API key if your LibreTranslate server requires authentication
4. Set default source and target languages
5. Test the connection

## Usage

### Via Context Menu
Select text in the editor → Right-click → Click "Translate"

### Via Hotkey
Select text → Press Ctrl+Shift+T (or custom hotkey)

### Via TopBar
Click the translation icon in the TopBar to open the translation dialog

### Via Slash Command
Type `/translate` in the editor to open the translation dialog

## Development

```bash
# Install dependencies
pnpm install

# Development mode
pnpm run dev

# Build for production
pnpm run build

# Lint
pnpm run lint
```

## API Reference

This plugin uses the [LibreTranslate API](https://libretranslate.com/):
- `POST /translate` - Translate text
- `GET /languages` - Get supported languages
- `GET /detect` - Detect language
- `GET /health` - Health check

## License

MIT
