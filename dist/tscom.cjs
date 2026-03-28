Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let node_buffer = require("node:buffer");
let node_stream = require("node:stream");
let glob = require("glob");
let plugin_error = require("plugin-error");
plugin_error = __toESM(plugin_error);
let rolldown = require("rolldown");
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
	const stream = new node_stream.Transform({ objectMode: true });
	stream._transform = async function(file, _enc, callback) {
		if (file.isNull()) return callback(null, file);
		if (file.isStream()) {
			callback(new plugin_error.default("tscom", "Streams are not supported"));
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
				const { output } = await (await (0, rolldown.rolldown)(inputOptions)).generate(outputOptions);
				const chunk = output[0];
				if (/\.ts$/i.test(filename)) file.extname = ".js";
				file.contents = node_buffer.Buffer.from(chunk.code);
				if (sourcemap && chunk.map) file.sourceMap = chunk.map;
				callback(null, file);
			} catch (err) {
				callback(new plugin_error.default("tscom", err, Object.assign({}, { fileName: file.path })));
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
	await (await (0, rolldown.rolldown)(inputOptions)).write(outputOptions);
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
	return await (0, glob.glob)(patterns, { ignore: ignoreList });
}
//#endregion
exports.compile = compile;
exports.defineOptions = defineOptions;
exports.getFiles = getFiles;
exports.tscom = tscom;
