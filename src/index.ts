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

  io.on('connection', client => {
    console.log(`client:${client} connected`);
    client.on('join', d => client.emit(`welcome!`));
  });
  const CapApp = new CaptureApp();
  CapApp.start({ height: 300, width: 300, maxLength: 10 });
};

export default recordServer;
