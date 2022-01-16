"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const child_process_1 = __importDefault(require("child_process"));
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
class CaptureApp {
    constructor() {
        this.width = 100;
        this.height = 100;
        this.frameRate = 60;
        this.maxLength = 6;
        this.name = 'recording';
        this.frameCount = 0;
        this.socketID = 'x';
        this.started = false;
        this.folder = process.env.HOME + `/.rubyqcapture`;
        this.start = ({ width, height, frameRate, maxLength, lengthIsFrames = false, name }, sID) => {
            let setLength = isNaN(maxLength) ? 6 : maxLength;
            this.socketID = sID;
            this.frameCount = 0;
            this.width = width || this.width;
            this.height = height || this.height;
            this.frameRate = frameRate || this.frameRate;
            this.maxLength = lengthIsFrames ? setLength : this.frameRate * setLength;
            this.name = name || this.name;
            this.folder = process.env.HOME + `/.rubyqcapture`;
            // check folder
            if (!isDirSync(this.folder))
                fs_1.default.mkdirSync(this.folder);
            this.clearFolder();
            this.started = true;
        };
        this.clearFolder = () => {
            fs_1.default.readdirSync(this.folder).map((d) => fs_1.default.unlinkSync(this.folder + '/' + d));
        };
        this.capture = (dataURL, sID) => {
            if (!this.started)
                return;
            if (sID !== this.socketID)
                return;
            const data = dataURL.replace(/^data:image\/\w+;base64,/, '');
            const title = `${this.name}_${this.frameCount.toString().padStart(6, '0')}.png`;
            const buf = Buffer.from(data, 'base64');
            fs_1.default.writeFileSync(this.folder + '/' + title, buf);
            this.frameCount++;
            process.stdout.write(`\r${this.frameCount} is less then ${this.maxLength}`);
            if (this.frameCount > this.maxLength) {
                this.stop();
            }
        };
        this.stop = (save = true) => {
            console.log(`stopped`);
            this.started = false;
            if (!save)
                return;
            this.save();
        };
        this.save = () => {
            let fm = this.name;
            console.log(exists(`${process.env.HOME}/${fm}.mp4`));
            while (exists(`${process.env.HOME}/${fm}.mp4`)) {
                fm += '_';
            }
            child_process_1.default.execSync(`ffmpeg -r ${this.frameRate} -s ${this.width + 'x' + this.height} -v info -f image2 -pattern_type sequence -i "${this.name}_%06d.png" -pix_fmt yuv420p -crf 12 -vcodec libx264 ../${fm}.mp4`, { cwd: this.folder });
            console.log(`Done!`);
            this.clearFolder();
        };
    }
}
exports.default = CaptureApp;
//# sourceMappingURL=CaptureApp.js.map