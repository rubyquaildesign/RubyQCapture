import exp from 'express';
import http from 'http';
import sio from 'socket.io';
const recordServer = (port: number) => {
  const app = exp();
  const server = http.createServer(app);
  const io = sio(server);
  server.listen(port);
};

export default recordServer;
