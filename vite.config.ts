import {defineConfig} from "vite";
import {resolve} from "path";
import {copyFileSync, mkdirSync, existsSync, cpSync} from "fs";

const isPro = process.env.NODE_ENV === "production";

function copyPluginFiles() {
    const filesToCopy = [
        {from: "plugin.json", to: "plugin.json"},
        {from: "icon.png", to: "icon.png"},
        {from: "preview.png", to: "preview.png"},
    ];

    filesToCopy.forEach(({from, to}) => {
        if (existsSync(from)) {
            copyFileSync(from, resolve(to));
        }
    });

    const readmeFiles = ["README.md", "README_ru_RU.md", "README_zh_CN.md"];
    readmeFiles.forEach(file => {
        if (existsSync(file)) {
            copyFileSync(file, resolve(file));
        }
    });

    const i18nSrc = "src/i18n";
    const i18nDest = resolve("i18n");
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
    ],
});