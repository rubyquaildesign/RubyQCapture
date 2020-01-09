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
  io.on('connection', client => {
    console.log(`client:${client.id} connected`);
    client.on('join', () => client.emit(`welcome!`));
    client.on('start', data => {
      console.table(data);
      CapApp.start(data, client.id);
    });
    client.on('capture', (data, cb) => {
      CapApp.capture(data, client.id);
      cb(true);
    });
    client.on('stop', data => CapApp.stop(data));
    client.on('save', () => CapApp.save());
    client.on('disconnect', () => console.log(`a user disconnected`));
  });
};

export default recordServer;
