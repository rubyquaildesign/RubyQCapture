import exp from 'express';
import http from 'http';
import sio from 'socket.io';
import CaptureApp from './CaptureApp';
const recordServer = (port: number) => {
  const app = exp();
  const server = http.createServer(app);
  const io = sio(server);
  server.listen(port);
  console.log(`server started`);

  const CapApp = new CaptureApp();
  CapApp.start({ height: 12, width: 20, maxLength: 100, frameRate: 30 });
  const testData =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAKElEQVQ4jWNgYGD4Twzu6FhFFGYYNXDUwGFpIAk2E4dHDRw1cDgaCAASFOffhEIO';
  for (let i = 0; i < 128; i++) {
    CapApp.capture(testData);
  }
  CapApp.stop(true);
  io.on('connection', client => {
    console.log(`client:${client} connected`);
    client.on('join', () => client.emit(`welcome!`));
    client.on('start', data => CapApp.start(data));
    client.on('capture', data => CapApp.capture(data));
    client.on('stop', data => CapApp.stop(data));
    client.on('save', () => CapApp.save());
  });
};

export default recordServer;
