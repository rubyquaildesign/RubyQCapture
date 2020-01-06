"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var http_1 = __importDefault(require("http"));
var socket_io_1 = __importDefault(require("socket.io"));
var CaptureApp_1 = __importDefault(require("./CaptureApp"));
var recordServer = function (port) {
    var app = express_1.default();
    var server = http_1.default.createServer(app);
    var io = socket_io_1.default(server);
    server.listen(port);
    console.log("server started");
    io.on('connection', function (client) {
        console.log("client:" + client + " connected");
        client.on('join', function (d) { return client.emit("welcome!"); });
    });
    var CapApp = new CaptureApp_1.default();
    CapApp.start({ height: 12, width: 20, maxLength: 100, frameRate: 30 });
    var testData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAKElEQVQ4jWNgYGD4Twzu6FhFFGYYNXDUwGFpIAk2E4dHDRw1cDgaCAASFOffhEIO';
    for (var i = 0; i < 128; i++) {
        CapApp.capture(testData);
    }
    CapApp.stop(true);
};
exports.default = recordServer;
//# sourceMappingURL=index.js.map