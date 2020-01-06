import path from 'path';
import fs from 'fs';
import cp from 'child_process';
import ut from 'util';
interface startArgs {
  width: number;
  height: number;
  frameRate?: number;
  maxLength: number;
  lengthIsFrames?: boolean;
  name?: string;
}

function exists(path: string) {
  try {
    return !!fs.statSync(path);
  } catch (e) {
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
  } catch (e) {
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
  private started = false;
  private folder: string = process.env.HOME + `/.rubyqcapture`;
  public start = ({
    width,
    height,
    frameRate,
    maxLength,
    lengthIsFrames = false,
    name,
  }: startArgs) => {
    this.width = width;
    this.height = height;
    this.frameRate = frameRate || this.frameRate;
    this.maxLength = lengthIsFrames ? maxLength : this.frameRate * maxLength;
    this.name = name || this.name;
    this.folder = process.env.HOME + `/.rubyqcapture`;
    // check folder
    const folderExists = isDirSync(this.folder);
    if (!folderExists) fs.mkdirSync(this.folder);
    console.log(`folder: ${isDirSync(this.folder)}`);
    // clear folder
    fs.readdirSync(this.folder).map(d => fs.unlinkSync(this.folder + '/' + d));
    this.started = true;
  };
  public capture = (dataURL: string) => {
    if (!this.started) return;
    const data = dataURL.replace(/^data:image\/\w+;base64,/, '');
    const title = `${this.name}_${this.frameCount
      .toString()
      .padStart(6, '0')}.png`;
    const buf = Buffer.from(data, 'base64');
    fs.writeFileSync(this.folder + '/' + title, buf);
    this.frameCount++;
  };
  public stop = (save: boolean = true) => {
    this.started = false;
    if (!save) return;
    this.save();
  };
  private save = () => {
    let fm = this.name;
    console.log(exists(`${process.env.HOME}/${fm}.mp4`));

    while (exists(`${process.env.HOME}/${fm}.mp4`)) {
      fm += '_';
    }
    cp.execSync(
      `ffmpeg -r ${this.frameRate} -s ${this.width +
        'x' +
        this.height} -v fatal -f image2 -pattern_type sequence -i "${
        this.name
      }_%06d.png" -pix_fmt yuv420p -crf 17 -vcodec libx264 ../${fm}.mp4`,
      { cwd: this.folder }
    );
    console.log(`Done!`);
  };
}
export default CaptureApp;
