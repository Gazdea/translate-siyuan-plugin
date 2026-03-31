import {defineConfig} from "vite";
import {resolve} from "path";
import {copyFileSync, mkdirSync, existsSync, cpSync} from "fs";

const isPro = process.argv.includes("--mode") && process.argv.includes("production");

function copyPluginFiles() {
    const filesToCopy = [
        {from: "plugin.json", to: "plugin.json"},
        {from: "icon.png", to: "icon.png"},
        {from: "preview.png", to: "preview.png"},
        {from: "style.css", to: "style.css"},
    ];

    filesToCopy.forEach(({from, to}) => {
        const srcPath = resolve(__dirname, from);
        const destPath = resolve(__dirname, to);
        if (existsSync(srcPath)) {
            copyFileSync(srcPath, destPath);
        }
    });

    const readmeFiles = ["README.md", "README_ru_RU.md", "README_zh_CN.md"];
    readmeFiles.forEach(file => {
        const srcPath = resolve(__dirname, file);
        if (existsSync(srcPath)) {
            copyFileSync(srcPath, resolve(__dirname, file));
        }
    });

    const i18nSrc = resolve(__dirname, "src/i18n");
    const i18nDest = resolve(__dirname, "i18n");
    if (existsSync(i18nSrc)) {
        if (!existsSync(i18nDest)) {
            mkdirSync(i18nDest, {recursive: true});
        }
        cpSync(i18nSrc, i18nDest, {recursive: true});
    }
}

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            formats: ["cjs"],
            fileName: "index",
        },
        rollupOptions: {
            external: ["siyuan"],
            output: {
                entryFileNames: "index.js",
                exports: "named",
            },
        },
        outDir: ".",
        minify: isPro,
        cssCodeSplit: false,
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: "modern-compiler",
            },
        },
    },
    plugins: [
        {
            name: "copy-plugin-files",
            closeBundle() {
                setTimeout(() => {
                    try {
                        copyPluginFiles();
                    } catch (e) {
                        console.error("Failed to copy plugin files:", e);
                    }
                }, 100);
            },
        },
        {
            name: "extract-css",
            writeBundle() {
                const cssContent = resolve("style.css");
                if (existsSync(cssContent)) {
                    console.log("CSS extracted to style.css");
                }
            },
        },
    ],
});
