import type WebSocketAsPromised from 'websocket-as-promised';
import z from 'zod';
import CaptureApp from './CaptureApplication.ts';
import { fromError } from 'zod-validation-error';
import { MessageSchema, type ResponseMessage } from './schemas.ts';
import isDataURI from './dataURI.ts';
const messageFormat = z.object({
  message: z.unknown(),
  id: z.union([z.string(), z.number()]),
});
export class CaptureServer {
  ws: WebSocketAsPromised;
  app?: CaptureApp;
  private onClose: () => void = () => 0;
  hasClosed = new Promise<void>((res) => {
    this.onClose = () => res();
  });
  public static async create(ws: WebSocketAsPromised) {
    const server = new CaptureServer(ws);
    await server.ws.open();
    server.ws.onUnpackedMessage.addListener(async (eventData: unknown) => {
      const parseResult = messageFormat.safeParse(eventData);
      if (parseResult.error) {
        server.ws.sendPacked({
          id: eventData && typeof eventData === 'object' && 'id' in eventData
            ? eventData.id
            : 0,
          message: {
            type: 'error',
            data: `invalid format: ${fromError(parseResult.error).toString()}`,
          },
        });
        throw new Error(
          `invalid format: ${fromError(parseResult.error).toString()}`,
        );
      }
      const msg = parseResult.data;
      const id = msg.id;
      const data = msg.message;
      const result = await server.handleMessage(id, data);
      if (!server.ws.isClosed) {
        server.ws.sendPacked({ id, message: result });
      }
    });
    return server;
  }
  private constructor(ws: WebSocketAsPromised) {
    this.ws = ws;
  }

  private async handleMessage(
    id: string | number,
    data: unknown,
  ): Promise<ResponseMessage> {
    const messageResult = MessageSchema.safeParse(data);
    if (messageResult.error) {
      return {
        data: fromError(messageResult.error).toString(),
        type: 'error',
      };
    }
    const msg = messageResult.data;
    if (msg.type === 'start') {
      console.table(msg.data);
      this.app = new CaptureApp(msg.data);
      await this.app.readyPromise;
      return { type: 'ready' };
    }
    if (!this.app) {
      return {
        type: 'error',
        data: "Capture Application hasn't started",
      };
    }
    if (msg.type === 'capture') {
      const captureData = msg.data;
      const isPngUrl = isDataURI(captureData);
      if (isPngUrl !== (this.app.type === 'pngUrl')) {
        return {
          type: 'error',
          data: 'Incorrect capture format',
        };
      }
      const success = await this.app
        .capture(captureData)
        .then(() => ({ type: 'ready' }) as ResponseMessage)
        .catch(() => {
          return {
            type: 'error',
            data: 'capture failed',
          } as ResponseMessage;
        });
      return success;
    }
    if (msg.type === 'stop') {
      await this.app.stop(msg.data.save);
      return this.ws.close().then(() => {
        this.onClose();
      }).then(() => ({ type: 'ready' }));
    }
    return {type:'error',data:`unknown message sent: ${JSON.stringify(msg)}`}
  }
}
