import path from 'path';
import fs from 'fs';
import cp from 'child_process';
import ut from 'util';
import { startArgs } from './startArgs';
function exists(path: string) {
  try {
    return !!fs.statSync(path);
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      return false;
    } else {
      throw e;
    }
  }
}
function isDirSync(aPath: string) {
  try {
    return fs.statSync(aPath).isDirectory();
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      return false;
    } else {
      throw e;
    }
  }
}
class CaptureApp {
  private width: number = 100;
  private height: number = 100;
  private frameRate: number = 60;
  private maxLength: number = 6;
  private name: string = 'recording';
  private frameCount = 0;
  private socketID: string = 'x';
  private started = false;
  private folder: string = process.env.HOME + `/.rubyqcapture`;
  public start = (
    { width, height, frameRate, maxLength, lengthIsFrames = false, name }: startArgs,
    sID: string
  ) => {
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
    if (!isDirSync(this.folder)) fs.mkdirSync(this.folder);
    this.clearFolder();
    this.started = true;
  };
  private clearFolder = () => {
    fs.readdirSync(this.folder).map((d) => fs.unlinkSync(this.folder + '/' + d));
  };
  public capture = (dataURL: string, sID: string) => {
    if (!this.started) return;
    if (sID !== this.socketID) return;
    const data = dataURL.replace(/^data:image\/\w+;base64,/, '');
    const title = `${this.name}_${this.frameCount.toString().padStart(6, '0')}.png`;
    const buf = Buffer.from(data, 'base64');
    fs.writeFileSync(this.folder + '/' + title, buf);
    this.frameCount++;
    process.stdout.write(`\r${this.frameCount} is less then ${this.maxLength}`);
    if (this.frameCount > this.maxLength) {
      this.stop();
    }
  };
  public stop = (save: boolean = true) => {
    console.log(`stopped`);
    this.started = false;
    if (!save) return;
    this.save();
  };
  public save = () => {
    let fm = this.name;
    console.log(exists(`${process.env.HOME}/${fm}.mp4`));

    while (exists(`${process.env.HOME}/${fm}.mp4`)) {
      fm += '_';
    }
    cp.execSync(
      `ffmpeg -r ${this.frameRate} -s ${
        this.width + 'x' + this.height
      } -v info -f image2 -pattern_type sequence -i "${
        this.name
      }_%06d.png" -pix_fmt yuv420p -crf 12 -vcodec libx264 ../${fm}.mp4`,
      { cwd: this.folder }
    );
    console.log(`Done!`);
    this.clearFolder();
  };
}
export default CaptureApp;
