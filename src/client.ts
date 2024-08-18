import { encodeBase64 } from '@std/encoding';
import {
	readyMessage,
	StartOptions,
	StartInput,
	type StartMessage,
} from './schemas';

type Listener = (event: MessageEvent<string>) => unknown;
export class CaptureClient {
	width = 0;
	height = 10;
	socket: WebSocket;
	format: 'pngUrl' | 'buffer' = 'pngUrl';
	constructor(port: number) {
		this.socket = new WebSocket(`ws://localhost:${port}`);
		this.socket.addEventListener('open', () => {
			console.log('opened');
		});
	}

	async start(opt: StartInput) {
		const sk = this.socket;
		if (sk.readyState !== sk.OPEN) {
			if (sk.readyState !== sk.CONNECTING)
				throw new Error(`sk is closing, don't call start`);
			await new Promise<void>((resolve) => (sk.onopen = () => resolve()));
		}
		const options = StartOptions.safeParse(opt);
		if (options.error) {
			throw new Error(`bad start data`);
		}
		this.width = options.data.width;
		this.height = options.data.height;
		this.format = options.data.format;
		sk.send(
			JSON.stringify({
				type: 'start',
				data: options.data,
			} satisfies StartMessage),
		);
		return new Promise<void>((resolve) => {
			const listener: Listener = (e) => {
				const msg = JSON.parse(e.data);
				if (readyMessage.safeParse(msg).success) {
					this.socket.removeEventListener('message', listener);
					resolve();
				}
			};
			this.socket.addEventListener('message', listener);
		});
	}

	captureCanvas(canvas: HTMLCanvasElement) {
		if (this.format !== 'pngUrl') {
			throw new Error('wrong format for canvas capture, use buffer instead');
		}
		const pm = new Promise<void>((resolve) => {
			this.socket.send(
				JSON.stringify({
					type: 'capture',
					data: canvas.toDataURL('image/png'),
				}),
			);
			const listener: Listener = (e) => {
				const msg = JSON.parse(e.data);
				if (readyMessage.safeParse(msg).success) {
					this.socket.removeEventListener('message', listener);
					resolve();
				}
			};
			this.socket.addEventListener('message', listener);
		});
		return pm;
	}

	captureBuffer(buffer: ArrayBuffer | Float32Array) {
		if (this.format !== 'buffer') {
			throw new Error('wrong format for canvas capture, use pngUrl instead');
		}
		const pm = new Promise<void>((resolve) => {
			const buf = buffer instanceof ArrayBuffer ? buffer : buffer.buffer;
			const dataString = encodeBase64(buf);
			this.socket.send(
				JSON.stringify({
					type: 'capture',
					data: dataString,
				}),
			);
			const listener: Listener = (e) => {
				const msg = JSON.parse(e.data);
				if (readyMessage.safeParse(msg).success) {
					this.socket.removeEventListener('message', listener);
					resolve();
				}
			};
			this.socket.addEventListener('message', listener);
		});
		return pm;
	}

	stop(save = true) {
		const promise = new Promise<void>((resolve) => {
			this.socket.send(
				JSON.stringify({
					type: 'stop',
					save,
				}),
			);
			this.socket.addEventListener(
				'message',
				() => {
					resolve();
				},
				{ once: true },
			);
		});
		return promise;
	}
}

export default CaptureClient;
