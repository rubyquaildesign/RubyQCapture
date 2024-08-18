import process from 'node:process';
import fs from 'node:fs/promises';
import path from 'path';
import * as S from './schemas.js';
import z from 'zod';
import cp from 'node:child_process';
import isDataURI from './dataURI.js';
import Sharp from 'sharp';

async function exists(filePath: string) {
	return await fs
		.access(filePath, fs.constants.F_OK)
		.then(() => true)
		.catch(() => false);
}
export class CaptureApp {
	width: number;
	height: number;
	frameRate: number;
	frameCount: number;
	length: number;
	type: 'pngUrl' | 'buffer';
	name: string;
	bitDepth: 8 | 16;
	folder: string;
	readyPromise: Promise<void>;
	isFolderReady: boolean;
	done: boolean;
	constructor(data: z.infer<typeof S.StartOptions>) {
		this.width = data.width;
		this.height = data.height;
		this.frameRate = data.frameRate;
		this.frameCount = 0;
		this.length = data.maxLength;
		this.type = data.format;
		this.name = data.name;
		this.done = false;
		this.bitDepth = 'bitDepth' in data ? data.bitDepth : 8;
		this.folder = path.resolve(process.env.HOME ?? '/', '.rubyqcapture');
		this.isFolderReady = false;
		this.readyPromise = fs
			.stat(this.folder)
			.then((stats) => {
				if (!stats.isDirectory()) {
					return fs.mkdir(this.folder);
				}
			})
			.then(() => {
				this.isFolderReady = true;
			});
	}

	async capture(data: string) {
		if (!this.isFolderReady) return;
		if (this.done) return;
		this.frameCount++;
		if (this.type === 'pngUrl') {
			if (!isDataURI(data)) {
				throw new Error('data is not dataUrl');
			}
			const dataChunk = data.replace(/^data:image\/\w+;base64,/, '');
			const title = `${this.name}_${this.frameCount
				.toString()
				.padStart(6, '0')}.png`;
			const buf = Buffer.from(dataChunk, 'base64');
			const filePath = path.resolve(this.folder, title);
			await fs.writeFile(filePath, buf);
		} else {
			if (!z.string().base64().safeParse(data).success) {
				throw new Error('data is not base64');
			}
			const buf = Buffer.from(data, 'base64');
			const arr = new Float32Array(buf);
			const image = await Sharp(arr, {
				raw: {
					width: this.width,
					height: this.height,
					channels: 4,
					premultiplied: true,
				},
				ignoreIcc: true,
			})
				.pipelineColorspace('rgb16')
				.withIccProfile('srgb')
				.toColorspace('rgb16')
				.png()
				.toBuffer();
			const title = `${this.name}_${this.frameCount
				.toString()
				.padStart(6, '0')}.png`;
			const filePath = path.resolve(this.folder, title);
			await fs.writeFile(filePath, image);
		}
		process.stdout.write(
			`\r written frame ${this.frameCount + 1} of ${this.length}`,
		);
		if (this.frameCount) {
			this.stop();
		}
	}

	async stop(save = true) {
		console.log('stopping');
		this.done = true;
		if (save) {
			await this.save();
		}
	}

	async save() {
		let fileName = path.resolve(process.env.HOME ?? '/', `${this.name}`);
		while (await exists(`${fileName}.mov`)) {
			fileName += '_';
		}
		const outputPath = fileName + '.mov';
		cp.execSync(
			`ffmpeg -r ${this.frameRate} -i "${this.name}_%06d.png" -c:v prores -pix_fmt yuv420p -profile:v 3 "${outputPath}"`,
			{ cwd: this.folder, stdio: 'inherit' },
		);
		console.log('done');
	}
}
export default CaptureApp;
