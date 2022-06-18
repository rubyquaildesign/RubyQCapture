
import {Server} from 'socket.io';
import CaptureApp from './CaptureApp';
const recordServer = (port: number) => {

  const io = new Server({cors:{
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
  },serveClient:false});

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
      cb();
    });
    client.on('stop', data => CapApp.stop(data));
    client.on('save', () => CapApp.save());
    client.on('disconnect', () => console.log(`a user disconnected`));
  });
  io.
  io.listen(port)
};

export default recordServer;
