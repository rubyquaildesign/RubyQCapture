#!/usr/bin/env -S deno run -A
import { parseArgs } from '@std/cli';
import { createdPromiseWS } from './promisify.ts';
import { CaptureServer } from './server.ts';
const parsedArgs = parseArgs(Deno.args);
const portNo = parsedArgs._[0];

let port = typeof portNo === 'string' ? parseFloat(portNo) : portNo;
if (port < 1000 || port > 9999) port = 2469;

Deno.serve({ port: port }, (request) => {
  if (request.headers.get('upgrade') != 'websocket') {
    return new Response(null, { status: 501 });
  }
  const sinfo = Deno.upgradeWebSocket(request);
  const sock = sinfo.socket;
  const ws = createdPromiseWS(sock);
  CaptureServer.create(ws).then((sv) => {
    console.log('new Connection to Server');
    console.log(`server: ${sv}`);
  });
  return sinfo.response;
});
