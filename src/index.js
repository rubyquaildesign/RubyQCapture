"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var http_1 = __importDefault(require("http"));
var socket_io_1 = __importDefault(require("socket.io"));
var recordServer = function (port) {
    var app = express_1.default();
    var server = http_1.default.createServer(app);
    var io = socket_io_1.default(server);
    server.listen(port);
};
exports.default = recordServer;
//# sourceMappingURL=index.js.map