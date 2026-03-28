import { Buffer } from "node:buffer";
import { Transform } from "node:stream";
import { glob } from "glob";
import PluginError from "plugin-error";
import { rolldown } from "rolldown";
//#region src/tscom.ts
function defineOptions({ filename, dir = "dist", format = "esm", minify = "dce-only", sourcemap = false }) {
	return {
		inputOptions: { input: filename },
		outputOptions: {
			dir,
			format,
			sourcemap,
			minify
		}
	};
}
/**
* Gulp plugin for compiles, bundles and minify JavaScript or TypeScript files using Rolldown.
* @param format - The output format for the compiled files.
* @param minify - Whether to minify the compiled files.
* @returns - Transform stream
*/
function tscom({ format = "esm", minify = "dce-only" } = {}) {
	const stream = new Transform({ objectMode: true });
	stream._transform = async function(file, _enc, callback) {
		if (file.isNull()) return callback(null, file);
		if (file.isStream()) {
			callback(new PluginError("tscom", "Streams are not supported"));
			return;
		}
		if (file.isBuffer()) {
			const filename = file.path;
			const dir = void 0;
			const sourcemap = file.sourceMap ? "hidden" : false;
			try {
				if (!/\.js$|\.ts$/i.test(filename)) throw new Error("Only file extensions \".js\" or \".ts\" are supported!");
				const { inputOptions, outputOptions } = defineOptions({
					filename,
					dir,
					format,
					minify,
					sourcemap
				});
				const { output } = await (await rolldown(inputOptions)).generate(outputOptions);
				const chunk = output[0];
				if (/\.ts$/i.test(filename)) file.extname = ".js";
				file.contents = Buffer.from(chunk.code);
				if (sourcemap && chunk.map) file.sourceMap = chunk.map;
				callback(null, file);
			} catch (err) {
				callback(new PluginError("tscom", err, Object.assign({}, { fileName: file.path })));
			}
		}
	};
	return stream;
}
/**
* Compiles, bundles and minify JavaScript or TypeScript files using Rolldown.
* @param input - The glob input file or files to compile.
* @param dir - The output directory for the compiled files.
* @param format - The output format for the compiled files.
* @param minify - Whether to minify the compiled files.
* @param sourcemap - Whether to generate source maps for the compiled files.
* @returns - Promise<void>
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
async function compile({ input, dir = "dist", format = "esm", minify = "dce-only", sourcemap = false }) {
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
	if (!/\.js$|\.ts$/i.test(filename)) throw new Error(`Only file extensions ".js" or ".ts" are supported!\nDetails:\n  filename: ${filename}`);
	const { inputOptions, outputOptions } = defineOptions({
		filename,
		dir,
		format,
		minify,
		sourcemap
	});
	await (await rolldown(inputOptions)).write(outputOptions);
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
export { compile, defineOptions, getFiles, tscom };
