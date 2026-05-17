import esbuild from "esbuild";
import process from "process";
import { builtinModules } from 'node:module';
import { readFileSync, writeFileSync } from 'fs';

const prod = (process.argv[2] === "production");

const context = await esbuild.context({
	entryPoints: ["src/main.ts"],
	bundle: true,
	external: [
		"obsidian",
		"electron",
		"@codemirror/autocomplete",
		"@codemirror/collab",
		"@codemirror/commands",
		"@codemirror/language",
		"@codemirror/lint",
		"@codemirror/search",
		"@codemirror/state",
		"@codemirror/view",
		"@lezer/common",
		"@lezer/highlight",
		"@lezer/lr",
		...builtinModules],
	format: "cjs",
	target: "es2020",
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	treeShaking: true,
	outfile: "main.js",
	minify: false,
	platform: "browser",
	plugins: [
		{
			name: "paipan-prepend",
			setup(build) {
				build.onEnd(() => {
					// 读取 paipan.js 并移除 ES module 导出语句和自动实例化
					let paipan = readFileSync("src/paipan.js", "utf8");
					paipan = paipan.replace(/export\s*\{[^}]*\}\s*;?/g, "");
					paipan = paipan.replace(/window\.p\s*=\s*window\.p\s*\|\|\s*new\s*paipan\(\)\s*;?/g, "");

					// 将 paipan 引擎拼接至 main.js 顶部（静态代码，无 eval）
					const mainJs = readFileSync("main.js", "utf8");
					writeFileSync("main.js", paipan + "\n" + mainJs);
				});
			},
		},
	],
});

if (prod) {
	await context.rebuild();
	process.exit(0);
} else {
	await context.watch();
}