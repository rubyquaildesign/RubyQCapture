import { WebSocketServer } from 'ws';
import CaptureApp from './CaptureApplication';

import * as S from './schemas';
import type * as zod from 'zod';
import { fromError } from 'zod-validation-error';
import isDataURI from './dataURI';
const response = JSON.stringify({ type: 'ready' } satisfies zod.infer<
	typeof S.readyMessage
>);
const recordServer = (port: number) => {
	const io = new WebSocketServer({
		port,
	});

	console.log(`server started`);

	let capApp: CaptureApp;
	io.on('connection', async (client) => {
		console.log(`client:${client.url} connected`);
		client.on('error', console.error);
		client.on('message', async (data) => {
			const messageData = JSON.parse(data.toString('utf-8'));
			const messageResult = S.MessageSchema.safeParse(messageData);
			if (messageResult.success === false) {
				const responseMessage = fromError(messageResult.error).toString();
				const reply = {
					type: 'error',
					data: responseMessage,
				} satisfies zod.infer<typeof S.errorMessage>;
				client.send(JSON.stringify(reply));
				return;
			}
			const msg = messageResult.data;
			if (msg.type === 'start') {
				console.table(msg.data);
				capApp = new CaptureApp(msg.data);
				await capApp.readyPromise;
				client.send(response);
				return;
			}
			if (!capApp) {
				const reply = {
					type: 'error',
					data: 'CaptureApplication Not Started',
				} satisfies zod.infer<typeof S.errorMessage>;
				client.send(JSON.stringify(reply));
				return;
			}
			if (msg.type === 'capture') {
				const data = msg.data;
				const isPngUrl = isDataURI(data);
				if (isPngUrl !== (capApp.type === 'pngUrl')) {
					const reply = {
						type: 'error',
						data: 'Incorrect capture format',
					} satisfies zod.infer<typeof S.errorMessage>;
					client.send(JSON.stringify(reply));
					return;
				}
				const success = await capApp
					.capture(data)
					.catch(() => {
						const reply = {
							type: 'error',
							data: 'capture failed',
						} satisfies zod.infer<typeof S.errorMessage>;
						client.send(JSON.stringify(reply));
						return false;
					})
					.then(() => true);
				if (success) {
					client.send(response);
				}
				return;
			}

			if (msg.type === 'stop') {
				await capApp.stop(msg.data.save);
				client.send(response);
				return;
			}
			const reply = {
				type: 'error',
				data: 'invalid message sent',
			} satisfies zod.infer<typeof S.errorMessage>;
			client.send(JSON.stringify(reply));
		});
	});
};

export default recordServer;
