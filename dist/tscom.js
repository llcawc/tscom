import { Buffer } from "node:buffer";
import { Transform } from "node:stream";
import PluginError from "plugin-error";
import { rolldown } from "rolldown";
import { minify } from "terser";
import { glob } from "tinyglobby";
//#region src/tscom.ts
/**
* Gulp plugin for compiles, bundles and minify JavaScript or TypeScript files using Rolldown.
* @param format - The output format for the compiled files. (default: 'esm')
* @param minify - Whether to minify the compiled files. (default: true)
* @returns Transform stream
*/
function tscom({ format = "esm", minify: minify$1 = true } = {}) {
	const stream = new Transform({ objectMode: true });
	stream._transform = async function(file, _enc, callback) {
		if (file.isNull()) return callback(null, file);
		if (file.isStream()) {
			callback(new PluginError("tscom", "Streams are not supported"));
			return;
		}
		if (file.isBuffer()) {
			const filename = file.path;
			const isMap = file.sourceMap ? true : false;
			const isMin = minify$1 ? true : false;
			try {
				if (!truExt(filename)) throw new Error("Only file extensions \".js\" or \".ts\" are supported!");
				const inputOptions = { input: filename };
				const outputOptions = {
					format,
					minify: false,
					sourcemap: isMap ? "hidden" : false
				};
				const { output } = await (await rolldown(inputOptions)).generate(outputOptions);
				const chunk = output[0];
				if (!/\.js$/i.test(filename)) file.extname = ".js";
				const terserMap = {
					content: chunk.map ? JSON.stringify(chunk.map) : void 0,
					url: void 0
				};
				const minOptions = typeof minify$1 === "object" ? {
					...minify$1,
					sourceMap: terserMap
				} : {
					sourceMap: terserMap,
					format: { comments: false }
				};
				if (isMin) {
					const { code, map } = await minify(chunk.code, minOptions);
					file.contents = Buffer.from(code ?? chunk.code);
					if (isMap && map) try {
						file.sourceMap = JSON.parse(typeof map === "string" ? map : JSON.stringify(map));
					} catch {
						if (chunk.map) file.sourceMap = chunk.map;
					}
				} else {
					file.contents = Buffer.from(chunk.code);
					if (isMap && chunk.map) file.sourceMap = chunk.map;
				}
				callback(null, file);
			} catch (err) {
				const opts = Object.assign({}, { fileName: file.path });
				callback(new PluginError("tscom", err instanceof Error ? err.message : String(err), opts));
			}
		}
	};
	return stream;
}
/**
* Compiles, bundles and minify JavaScript or TypeScript files using Rolldown.
* @param input - The glob input file or files to compile.
* @param dir - The output directory for the compiled files. (default: 'dist')
* @param format - The output format for the compiled files. (default: 'esm')
* @param minify - Whether to minify the compiled files. (default: 'true)
* @param sourcemap - Whether to generate source maps for the compiled files. (default: false)
* @returns Promise void
*
* @example
*
* ```js
* // import modules
* import { compile } from "tscom";
*
* const compileConfig = {
*   input: ["src/ts/*.*", "!src/ts/test.js"], // glob input
*   dir: "dist/js",
*   format: "es",
*   minify: false,
*   sourcemap: true,
* };
*
* // scripts task
* export async function scripts() {
*   await compile(compileConfig);
* }
*
* // run scripts
* await scripts();
* ```
*/
async function compile({ input, dir = "dist", format = "esm", minify = true, sourcemap = false }) {
	const pathList = await getFiles(input);
	if (!input || pathList.length === 0) throw new Error("Not found input file/s");
	await Promise.all(pathList.map((filename) => compileFile({
		filename,
		dir,
		format,
		minify,
		sourcemap
	})));
}
async function compileFile({ filename, dir, format, minify, sourcemap }) {
	if (!truExt(filename)) throw new Error(`Only file extensions ".js" or ".ts" are supported!\nDetails:\n  filename: ${filename}`);
	const inputOptions = { input: filename };
	const outputOptions = {
		dir,
		format,
		minify,
		sourcemap,
		comments: minify === true ? false : true
	};
	await (await rolldown(inputOptions)).write(outputOptions);
}
function truExt(filename) {
	if (/\.js$|\.mjs$|\.cjs$|\.jsx$|\.ts$|\.tsx$/i.test(filename)) return true;
	return false;
}
async function getFiles(inputFiles) {
	let patterns = inputFiles;
	let ignoreList = void 0;
	if (Array.isArray(inputFiles)) {
		const positivePatterns = inputFiles.filter((file) => !/!/.test(file));
		const negativePatterns = inputFiles.filter((file) => /!/.test(file)).map((item) => item.replace(/!/, ""));
		patterns = positivePatterns.length > 0 ? positivePatterns : [];
		ignoreList = negativePatterns.length > 0 ? negativePatterns : void 0;
	}
	return await glob(patterns, { ignore: ignoreList });
}
//#endregion
export { compile, getFiles, tscom };
