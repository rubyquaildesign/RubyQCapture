import sharp from 'sharp';

const width = 512;
const height = 512;
const data = new Float32Array(width * height * 4);
for (let y = 0; y < height; y++) {
	for (let x = 0; x < width; x++) {
		const red = x / (width - 1);
		const green = y / (height - 1);
		const i = y * width + x;
		data.set([red, green, 0.0, 1.0], i);
	}
}
let sOne = sharp(data, {
	raw: {
		width,
		height,
		channels: 4,
		premultiplied: true,
	},
	ignoreIcc: true,
});
let sTwo = sharp(data, {
	raw: {
		width,
		height,
		channels: 4,
		premultiplied: true,
	},
	ignoreIcc: true,
});
sOne = sOne.toColorspace('rbg16').withIccProfile('p3').png();
sTwo = sTwo.toColorspace('rbg16').withIccProfile('srgb').png();
await sOne.toFile('./testSRgb.png');
await sTwo.toFile('./testP3.png');
