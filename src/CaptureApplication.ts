import * as path from '@std/path';
import type * as S from './schemas.ts';
import type z from 'zod';
import { Buffer } from 'node:buffer';
import isDataURI from './dataURI.ts';
import Sharp from 'sharp';
import { ulid } from '@std/ulid';
// @ts-types="npm:@types/pako@2"
import { inflate } from 'pako';
/**
 * Check if a file exists
 *
 * @param filePath file to check
 */
const pathExists = (filePath: string) =>
	Deno.lstat(filePath).catch((err) => {
		if (!(err instanceof Deno.errors.NotFound)) throw err;
		return false;
	}).then((b) => !!b);

/**
 * Capturer
 *
 * @export
 * @class CaptureApp
 */
export class CaptureApp {
	width: number;
	height: number;
	frameRate: number;
	frameCount: number;
	length: number;
	type: 'pngUrl' | 'buffer';
	name: string;
	bitDepth: 8 | 16;
	ULID: string;
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
		this.ULID = data.ulid ?? ulid();
		this.done = false;
		this.bitDepth = 'bitDepth' in data ? data.bitDepth : 8;
		this.folder = path.resolve(Deno.env.get('HOME') ?? '/', '.rubyqcapture');
		this.isFolderReady = false;
		this.readyPromise = Deno.mkdir(this.folder).catch((err) => {
			if (!(err instanceof Deno.errors.AlreadyExists)) throw err;
		}).then(() => {
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
			const title = `${this.name}-${this.ULID.slice(4, 16)}_${
				this.frameCount
					.toString()
					.padStart(6, '0')
			}.png`;
			const buf = Buffer.from(dataChunk, 'base64');
			const filePath = path.resolve(this.folder, title);
			await Deno.writeFile(filePath, buf);
		} else {
			const buf = Buffer.from(data, 'base64');
			const tol = inflate(buf);
			const arr = new Float32Array(tol.buffer).map((f) =>
				Math.floor(f * 65535)
			);
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
			const title = `${this.name}-${this.ULID.slice(4, 16)}_${
				this.frameCount
					.toString()
					.padStart(6, '0')
			}.png`;
			const filePath = path.resolve(this.folder, title);
			await Deno.writeFile(filePath, image);
		}
		await Deno.stdout.write(
			new TextEncoder().encode(
				`\r written frame ${this.frameCount + 1} of ${this.length}`,
			),
		);
		if (this.frameCount >= this.length) {
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
		let fileName = path.resolve(Deno.env.get('HOME') ?? '/', `${this.name}`);

		while (await pathExists(`${fileName}-${this.ULID.slice(4, 16)}.mov`)) {
			fileName += '_';
		}
		const outputPath = `${fileName}-${this.ULID.slice(4, 16)}` + '.mov';
		const cmd = new Deno.Command('ffmpeg', {
			args: [
				'-r',
				this.frameRate.toString(),
				'-i',
				`${this.name}-${
					this.ULID.slice(
						4,
						16,
					)
				}_%06d.png`,
				'-c:v',
				'prores',
				'-pix_fmt',
				'yuv422p10le',
				'-profile:v',
				'3',
				outputPath,
			],
			stdout: 'inherit',
			stderr: 'inherit',
			cwd: this.folder,
		});
		// const cmd = new Deno.Command(
		// 	`ffmpeg -r ${this.frameRate} -i "${this.name}-${
		// 		this.ULID.slice(
		// 			4,
		// 			16,
		// 		)
		// 	}_%06d.png" -c:v prores -pix_fmt yuv422p10le -profile:v 3 "${outputPath}"`,
		// 	{
		// 		stdout: 'inherit',
		// 	},
		// );
		const output = await cmd.output();
		console.log('done');
		return output.code === 0;
	}
}
export default CaptureApp;
