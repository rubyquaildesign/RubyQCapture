"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = __importDefault(require("socket.io"));
const CaptureApp_1 = __importDefault(require("./CaptureApp"));
const recordServer = (port) => {
    const app = express_1.default();
    const server = http_1.default.createServer(app);
    const io = socket_io_1.default(server);
    server.listen(port);
    console.log(`server started`);
    const CapApp = new CaptureApp_1.default();
    io.on('connection', client => {
        console.log(`client:${client.id} connected`);
        client.on('join', () => client.emit(`welcome!`));
        client.on('start', data => {
            console.table(data);
            CapApp.start(data);
        });
        client.on('capture', data => CapApp.capture(data));
        client.on('stop', data => CapApp.stop(data));
        client.on('save', () => CapApp.save());
        client.on('disconnect', () => console.log(`a user disconnected`));
    });
};
exports.default = recordServer;
//# sourceMappingURL=index.js.map