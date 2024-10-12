import WebSocketAsPromised from 'websocket-as-promised';
import * as mp from '@std/msgpack';
export function createdPromiseWS(socket: WebSocket) {
  const ws = new WebSocketAsPromised('', {
    createWebSocket: () => socket,
    packMessage: (data) => mp.encode(data),
    unpackMessage: async (data) => {
      if (typeof data === 'string') {
        const dArray = new TextEncoder().encode(data);
        return mp.decode(dArray);
      } else if (data instanceof Blob) {
        const b = await data.arrayBuffer()
        return mp.decode(new Uint8Array(b));
      } else {
        return mp.decode(new Uint8Array(data));
      }
    },
    attachRequestId: (data, id) => {
      return Object.assign(data,{id})
    },
    extractRequestId: (data) => {
      return data.id
    }
  });
  return ws;
}
