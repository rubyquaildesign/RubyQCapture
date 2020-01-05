import path from 'path';
import fs from 'fs';
interface startArgs {
  width: number;
  height: number;
  frameRate?: number;
  maxLength: number;
  lengthIsFrames?: boolean;
  name?: string;
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
  private started = false;
  public start = async ({
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
    this.maxLength = lengthIsFrames ? this.frameRate * maxLength : maxLength;
    this.name = name || this.name;
    const folder = process.env.HOME + `/.rubyqcapture`;
    // check folder
    const folderExists = isDirSync(folder);
    if (!folderExists) fs.mkdirSync(folder);
    console.log(`folder: ${isDirSync(folder)}`);
    fs.readdirSync(folder).map(d => fs.unlinkSync(folder + '/' + d));
    this.started = true;
  };
}
export default CaptureApp;
