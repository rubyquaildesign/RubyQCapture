import * as z from 'zod';
import { ulid } from '@std/ulid';
import isDataURI from './dataURI';
const alwaysOptions = z.object({
	frameRate: z.number().default(60),
	maxLength: z.number().default(6 * 60),
	name: z.string().default(() => ulid()),
	width: z.number().int().positive().safe(),
	height: z.number().int().positive().safe(),
});
const pngURLOptions = alwaysOptions.extend({
	format: z.literal('pngUrl').default('pngUrl'),
});
const BufferOptions = alwaysOptions.extend({
	format: z.literal('buffer'),
	bitDepth: z.union([z.literal(8), z.literal(16)]),
});
export const StartOptions = z.discriminatedUnion('format', [
	pngURLOptions,
	BufferOptions,
]);
export type StartInput = z.input<typeof StartOptions>;
export const startWSMessage = z.object({
	type: z.literal('start'),
	data: StartOptions,
});
export type StartMessage = z.input<typeof startWSMessage>;
export const errorMessage = z.object({
	type: z.literal('error'),
	data: z.string(),
});
export type ErrorMessage = z.input<typeof errorMessage>;
export const readyMessage = z.object({
	type: z.literal('ready'),
});

export const pngUrlDataMessage = z.object({
	type: z.literal('capture'),
	data: z.string().refine(isDataURI),
});
export const bufferDataMessage = z.object({
	type: z.literal('capture'),
	data: z.string().base64(),
});
export const stopMessage = z.object({
	type: z.literal('stop'),
	data: z
		.object({
			save: z.boolean().default(true),
		})
		.default({ save: true }),
});
export const MessageSchema = z.discriminatedUnion('type', [
	startWSMessage,
	readyMessage,
	errorMessage,
	stopMessage,
	bufferDataMessage,
	pngUrlDataMessage,
]);
