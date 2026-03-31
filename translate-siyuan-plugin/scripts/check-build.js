#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const requiredFiles = [
    "index.js",
    "style.css",
    "plugin.json",
    "i18n/en_US.json",
    "i18n/ru_RU.json",
    "i18n/zh_CN.json",
    "icon.png",
    "preview.png"
];

const requiredDirs = ["i18n"];

let errors = [];
let warnings = [];

console.log("=== LibreTranslate Plugin Build Check ===\n");

const pluginDir = path.dirname(__dirname);

requiredFiles.forEach(file => {
    const filePath = path.join(pluginDir, file);
    if (!fs.existsSync(filePath)) {
        errors.push(`MISSING: ${file}`);
    } else {
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
            warnings.push(`EMPTY: ${file}`);
        } else {
            console.log(`✓ ${file} (${stats.size} bytes)`);
        }
    }
});

requiredDirs.forEach(dir => {
    const dirPath = path.join(pluginDir, dir);
    if (!fs.existsSync(dirPath)) {
        errors.push(`MISSING DIR: ${dir}`);
    } else {
        console.log(`✓ ${dir}/ (directory exists)`);
    }
});

const pluginJson = path.join(pluginDir, "plugin.json");
if (fs.existsSync(pluginJson)) {
    const plugin = JSON.parse(fs.readFileSync(pluginJson, "utf-8"));
    if (!plugin.js || !plugin.js.includes("index.js")) {
        errors.push("plugin.json: missing or incorrect 'js' field");
    } else {
        console.log("✓ plugin.json 'js' field");
    }
    if (!plugin.css || !plugin.css.includes("style.css")) {
        errors.push("plugin.json: missing or incorrect 'css' field");
    } else {
        console.log("✓ plugin.json 'css' field");
    }
    if (!plugin.i18n) {
        warnings.push("plugin.json: missing 'i18n' field (optional)");
    } else {
        console.log("✓ plugin.json 'i18n' field");
    }
}

const indexJs = path.join(pluginDir, "index.js");
if (fs.existsSync(indexJs)) {
    const content = fs.readFileSync(indexJs, "utf-8");
    if (content.includes("process.")) {
        errors.push("index.js contains 'process' - will cause runtime error!");
    } else {
        console.log("✓ index.js: no 'process' references");
    }
    if (content.includes("window.i18n")) {
        errors.push("index.js contains 'window.i18n' - will cause runtime error!");
    } else {
        console.log("✓ index.js: no 'window.i18n' references");
    }
}

const styleCss = path.join(pluginDir, "style.css");
if (fs.existsSync(styleCss)) {
    const content = fs.readFileSync(styleCss, "utf-8");
    if (content.includes(".libre-translate-dialog")) {
        console.log("✓ style.css contains dialog styles");
    } else {
        warnings.push("style.css may be missing dialog styles");
    }
}

console.log("\n=== Results ===\n");

if (errors.length > 0) {
    console.log("ERRORS:");
    errors.forEach(e => console.log(`  ✗ ${e}`));
    process.exit(1);
}

if (warnings.length > 0) {
    console.log("WARNINGS:");
    warnings.forEach(w => console.log(`  ⚠ ${w}`));
}

console.log("All checks passed! ✓");
process.exit(0);
