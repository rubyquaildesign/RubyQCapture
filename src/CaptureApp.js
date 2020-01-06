"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var child_process_1 = __importDefault(require("child_process"));
function exists(path) {
    try {
        return !!fs_1.default.statSync(path);
    }
    catch (e) {
        if (e.code === 'ENOENT') {
            return false;
        }
        else {
            throw e;
        }
    }
}
function isDirSync(aPath) {
    try {
        return fs_1.default.statSync(aPath).isDirectory();
    }
    catch (e) {
        if (e.code === 'ENOENT') {
            return false;
        }
        else {
            throw e;
        }
    }
}
var CaptureApp = /** @class */ (function () {
    function CaptureApp() {
        var _this = this;
        this.width = 100;
        this.height = 100;
        this.frameRate = 60;
        this.maxLength = 6;
        this.name = 'recording';
        this.frameCount = 0;
        this.started = false;
        this.folder = process.env.HOME + "/.rubyqcapture";
        this.start = function (_a) {
            var width = _a.width, height = _a.height, frameRate = _a.frameRate, maxLength = _a.maxLength, _b = _a.lengthIsFrames, lengthIsFrames = _b === void 0 ? false : _b, name = _a.name;
            _this.width = width;
            _this.height = height;
            _this.frameRate = frameRate || _this.frameRate;
            _this.maxLength = lengthIsFrames ? maxLength : _this.frameRate * maxLength;
            _this.name = name || _this.name;
            _this.folder = process.env.HOME + "/.rubyqcapture";
            // check folder
            var folderExists = isDirSync(_this.folder);
            if (!folderExists)
                fs_1.default.mkdirSync(_this.folder);
            console.log("folder: " + isDirSync(_this.folder));
            // clear folder
            fs_1.default.readdirSync(_this.folder).map(function (d) { return fs_1.default.unlinkSync(_this.folder + '/' + d); });
            _this.started = true;
        };
        this.capture = function (dataURL) {
            if (!_this.started)
                return;
            var data = dataURL.replace(/^data:image\/\w+;base64,/, '');
            var title = _this.name + "_" + _this.frameCount
                .toString()
                .padStart(6, '0') + ".png";
            var buf = Buffer.from(data, 'base64');
            fs_1.default.writeFileSync(_this.folder + '/' + title, buf);
            _this.frameCount++;
        };
        this.stop = function (save) {
            if (save === void 0) { save = true; }
            _this.started = false;
            if (!save)
                return;
            _this.save();
        };
        this.save = function () {
            var fm = _this.name;
            console.log(exists(process.env.HOME + "/" + fm + ".mp4"));
            while (exists(process.env.HOME + "/" + fm + ".mp4")) {
                fm += '_';
            }
            child_process_1.default.execSync("ffmpeg -r " + _this.frameRate + " -s " + (_this.width +
                'x' +
                _this.height) + " -v fatal -f image2 -pattern_type sequence -i \"" + _this.name + "_%06d.png\" -pix_fmt yuv420p -crf 17 -vcodec libx264 ../" + fm + ".mp4", { cwd: _this.folder });
            console.log("Done!");
        };
    }
    return CaptureApp;
}());
exports.default = CaptureApp;
//# sourceMappingURL=CaptureApp.js.map