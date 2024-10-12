import { encodeBase64 } from '@std/encoding';
import { ulid } from '@std/ulid';
import { deflate } from 'pako';
import type WebSocketAsPromised from 'websocket-as-promised';
import type z from 'zod';
import { createdPromiseWS } from './promisify.ts';
import {
  type bufferDataMessage,
  errorMessage,
  type pngUrlDataMessage,
  type StartInput,
  type StartMessage,
  StartOptions,
  type stopMessage,
} from './schemas.ts';

export class CaptureClient {
  width = 0;
  height = 10;
  ws: WebSocketAsPromised;
  format: 'pngUrl' | 'buffer' = 'pngUrl';
  ulid: string = ulid();
  static async create(port: number, startInput: StartInput): Promise<CaptureClient> {
    const server = new CaptureClient(port);
    await server.ws.open();
    const options = StartOptions.safeParse(startInput);
    if (options.error) {
      await server.ws.close();
      throw new Error(`bad start data`);
    }
    server.width = options.data.width;
    server.height = options.data.height;
    server.format = options.data.format;
    server.ulid = options.data.ulid;
    server.ws.onUnpackedMessage.addListener(async (data: unknown) => {
      if (!(data && typeof data === 'object' && 'message' in data)) {
        await server.ws.close();
        throw new Error('invalid message');
      }
      const msgResult = errorMessage.safeParse(data.message);
      if (msgResult.success) {
        await server.ws.close();
        throw new Error(msgResult.data.data);
      }
    });
    await server.ws.sendRequest(
      { message: { type: 'start', data: options.data } satisfies StartMessage },
    );
    return server;
  }
  private constructor(port: number) {
    const socket = new WebSocket(`ws://localhost:${port}`);
    this.ws = createdPromiseWS(socket);
  }

  async captureCanvas(dataUrl: string) {
    if (this.format !== 'pngUrl') {
      throw new Error('wrong format for canvas capture, use buffer instead');
    }
    await this.ws.sendRequest({
      message: {
        ulid: this.ulid,
        data: dataUrl,
        type: 'capture',
      } satisfies z.infer<typeof pngUrlDataMessage>,
    });
  }

  async captureBuffer(buffer: ArrayBuffer | Float32Array) {
    if (this.format !== 'buffer') {
      throw new Error('wrong format for canvas capture, use pngUrl instead');
    }
    const buf = buffer instanceof ArrayBuffer ? buffer : buffer.buffer;
    const smol = deflate(buf);
    const dataString = encodeBase64(smol);
    await this.ws.sendRequest({
      message: {
        ulid: this.ulid,
        data: dataString,
        type: 'capture',
      } satisfies z.infer<typeof bufferDataMessage>,
    });
  }

  async stop(save = true) {
    await this.ws.sendRequest({
      message: {
        type: 'stop',
        data: { save },
        ulid: this.ulid,
      } satisfies z.infer<typeof stopMessage>,
    });
  }
}

export default CaptureClient;
